from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Annotated
import models
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal, get_db
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from schema import *

app = FastAPI(title="API Clinique Vétérinaire - ALSI61")
models.Base.metadata.create_all(bind=engine)


def ensure_soft_delete_columns():
    inspector = inspect(engine)
    table_columns = {
        table_name: {column["name"] for column in inspector.get_columns(table_name)}
        for table_name in inspector.get_table_names()
    }

    with engine.begin() as connection:
        if "etablissements" in table_columns and "est_actif" not in table_columns["etablissements"]:
            connection.execute(text("ALTER TABLE etablissements ADD COLUMN est_actif BOOLEAN NOT NULL DEFAULT 1"))

        if "animaux" in table_columns and "est_actif" not in table_columns["animaux"]:
            connection.execute(text("ALTER TABLE animaux ADD COLUMN est_actif BOOLEAN NOT NULL DEFAULT 1"))


ensure_soft_delete_columns()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
db_dependency = Annotated[Session, Depends(get_db)]


# ─────────────────────────────────────────────
# SANTÉ
# ─────────────────────────────────────────────

@app.get("/ping")
async def ping():
    return {"status": "ok", "message": "Le serveur répond !"}


# ─────────────────────────────────────────────
# INSCRIPTION UNIFIÉE (compte + profil en une seule requête)
# ─────────────────────────────────────────────

@app.post("/signup-full", status_code=201)
async def signup_full(data: UserSignupFull, db: db_dependency):
    """
    Crée un CompteUser + le profil associé (Proprietaire ou Veterinaire)
    en une seule transaction atomique.
    """
    try:
        # 1. Création du compte
        new_user = models.CompteUser(
            mail=data.mail,
            mot_de_passe=data.mot_de_passe,
            role=data.role
        )
        db.add(new_user)
        db.flush()  # Génère id_user sans commiter

        # 2. Création du profil selon le rôle
        if data.role == "client":
            new_profile = models.Proprietaire(
                id_user=new_user.id_user,
                nom=data.nom,
                prenom=data.prenom,
                telephone=data.telephone
            )
            db.add(new_profile)

        elif data.role == "veto":
            new_profile = models.Veterinaire(
                id_user=new_user.id_user,
                nom=data.nom,
                prenom=data.prenom,
                telephone=data.telephone,
                id_etablissement=None  # À compléter plus tard si besoin
            )
            db.add(new_profile)

        db.commit()
        return {
            "message": "Compte et profil créés avec succès",
            "userId": new_user.id_user,
            "role": new_user.role
        }

    except Exception as e:
        db.rollback()
        if "1062" in str(e):
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")
        raise HTTPException(status_code=500, detail=f"Erreur inscription : {str(e)}")


# ─────────────────────────────────────────────
# AUTHENTIFICATION
# ─────────────────────────────────────────────

@app.post("/login")
async def login(credentials: LoginRequest, db: db_dependency):
    # 1. On récupère l'utilisateur via SQL pur
    # .mappings() est CRUCIAL pour éviter l'Internal Server Error
    query = text("SELECT * FROM compte_users WHERE mail = :mail AND est_actif = 1")
    user = db.execute(query, {"mail": credentials.mail}).mappings().fetchone()
    
    # 2. Vérification de l'existence du compte
    if not user:
        raise HTTPException(status_code=403, detail="Compte inexistant ou désactivé.")

    # 3. VÉRIFICATION DU MOT DE PASSE
    # On compare ce que l'user tape avec la colonne 'password' de la BDD
    if user["mot_de_passe"] != credentials.mot_de_passe:
        raise HTTPException(status_code=401, detail="Mot de passe incorrect.")

    # 4. Préparation des données de base
    user_data = {
        "id_user": user["id_user"],
        "mail": user["mail"],
        "role": user["role"],
        "has_profile": False
    }

    # 5. Vérification du profil selon le rôle (Veto ou Client)
    if user["role"] == "veto":
        # On utilise l'id_user pour chercher dans la table veterinaires
        veto = db.query(models.Veterinaire).filter(models.Veterinaire.id_user == user["id_user"]).first()
        if veto and veto.nom and veto.nom.strip() not in ["", "À compléter"]:
            user_data["has_profile"] = True
            user_data["id_veterinaire"] = veto.id_veterinaire
            user_data["nom"] = veto.nom
            user_data["prenom"] = veto.prenom
    
    elif user["role"] == "client":
        # On utilise l'id_user pour chercher dans la table proprietaires
        proprio = db.query(models.Proprietaire).filter(models.Proprietaire.id_user == user["id_user"]).first()
        if proprio and proprio.nom and proprio.nom.strip() not in ["", "À compléter"]:
            user_data["has_profile"] = True
            user_data["id_proprietaire"] = proprio.id_proprietaire
            user_data["nom"] = proprio.nom
            user_data["prenom"] = proprio.prenom

    # 6. Retour final au frontend React
    return {"status": "success", "user": user_data}

@app.patch("/users/desactiver/{id_user}")
async def deactivate_user(id_user: int, db: db_dependency):
    user = db.query(models.CompteUser).filter(models.CompteUser.id_user == id_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    user.est_actif = False

    # Si c'est un client, on désactive aussi tous ses animaux
    if user.role == "client":
        proprio = db.query(models.Proprietaire).filter(models.Proprietaire.id_user == id_user).first()
        if proprio:
            db.query(models.Animal).filter(
                models.Animal.id_proprietaire == proprio.id_proprietaire
            ).update({models.Animal.est_actif: False}, synchronize_session=False)

    db.commit()

    return {"status": "success", "message": f"Le compte {id_user} a été désactivé."}


@app.patch("/users/reactiver/{id_user}")
async def reactivate_user(id_user: int, db: db_dependency):
    user = db.query(models.CompteUser).filter(models.CompteUser.id_user == id_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    user.est_actif = True

    if user.role == "client":
        proprio = db.query(models.Proprietaire).filter(models.Proprietaire.id_user == id_user).first()
        if proprio:
            db.query(models.Animal).filter(
                models.Animal.id_proprietaire == proprio.id_proprietaire
            ).update({models.Animal.est_actif: True}, synchronize_session=False)

    db.commit()

    return {"status": "success", "message": f"Le compte {id_user} a été réactivé."}


# ─────────────────────────────────────────────
# COMPTE USER (CRUD de base)
# ─────────────────────────────────────────────

@app.post("/users/", response_model=CompteUserOut, status_code=201)
async def create_user(user: CompteUserCreate, db: db_dependency):
    try:
        db_user = models.CompteUser(**user.model_dump())
        db.add(db_user)
        db.flush()

        # Crée un profil vide si client (valeurs par défaut)
        if db_user.role == "client":
            db.add(models.Proprietaire(
                id_user=db_user.id_user,
                nom="À compléter",
                prenom="À compléter",
                telephone="0000000000"
            ))

        db.commit()
        db.refresh(db_user)
        return db_user

    except Exception as e:
        db.rollback()
        if "1062" in str(e):
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/{user_id}", response_model=CompteUserOut)
async def read_user(user_id: int, db: db_dependency):
    user = db.query(models.CompteUser).filter(
        models.CompteUser.id_user == user_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return user


# ─────────────────────────────────────────────
# PROPRIÉTAIRES
# ─────────────────────────────────────────────

@app.get("/proprietaires/me/{user_id}", response_model=ProprietaireOut)
async def get_owner_by_user_id(user_id: int, db: db_dependency):
    """Récupère le profil propriétaire à partir de l'id_user (pas id_proprietaire)."""
    owner = db.query(models.Proprietaire).filter(
        models.Proprietaire.id_user == user_id
    ).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Profil propriétaire introuvable")
    return owner


@app.put("/proprietaires/me/{user_id}", response_model=ProprietaireOut)
async def update_proprietaire(user_id: int, data: ProprietaireUpdate, db: db_dependency):
    """Met à jour le profil propriétaire identifié par l'id_user."""
    proprio = db.query(models.Proprietaire).filter(
        models.Proprietaire.id_user == user_id
    ).first()
    if not proprio:
        raise HTTPException(status_code=404, detail="Profil propriétaire introuvable")

    proprio.nom = data.nom
    proprio.prenom = data.prenom
    proprio.telephone = data.telephone

    db.commit()
    db.refresh(proprio)
    return proprio


@app.post("/proprietaires/", response_model=ProprietaireOut, status_code=201)
async def create_proprietaire(proprio: ProprietaireCreate, db: db_dependency):
    try:
        db_proprio = models.Proprietaire(**proprio.model_dump())
        db.add(db_proprio)
        db.commit()
        db.refresh(db_proprio)
        return db_proprio
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Vous avez déjà un profil propriétaire.")



# ─────────────────────────────────────────────
# ÉTABLISSEMENTS
# ─────────────────────────────────────────────

@app.get("/etablissements/villes")
async def get_villes(db: db_dependency):
    """Retourne la liste des villes distinctes ayant au moins un établissement."""
    rows = db.query(models.Etablissement.ville).filter(
        models.Etablissement.est_actif.is_(True)
    ).distinct().all()
    return [r[0] for r in rows if r[0]]

@app.get("/etablissements/", response_model=List[EtablissementOut])
async def get_etablissements(ville: str = None, db: db_dependency = None):
    """Liste tous les établissements, filtrables par ville."""
    q = db.query(models.Etablissement).filter(models.Etablissement.est_actif.is_(True))
    if ville:
        q = q.filter(models.Etablissement.ville == ville)
    return q.all()

@app.post("/etablissements/", response_model=EtablissementOut, status_code=201)
async def create_etablissement(data: EtablissementCreate, db: db_dependency):
    existing = db.query(models.Etablissement).filter(
        models.Etablissement.nom_etablissement == data.nom_etablissement,
        models.Etablissement.ville == data.ville
    ).first()
    if existing:
        existing.nom_etablissement = data.nom_etablissement
        existing.ville = data.ville
        existing.adresse = data.adresse
        existing.est_actif = True
        db.commit()
        db.refresh(existing)
        return existing
    etab = models.Etablissement(**data.model_dump())
    db.add(etab)
    db.commit()
    db.refresh(etab)
    return etab

@app.get("/veterinaires/ville/{ville}", response_model=List[VeterinaireAvecEtablissement])
async def get_vetos_par_ville(ville: str, db: db_dependency):
    """Retourne les vétérinaires exerçant dans une ville donnée."""
    vetos = db.query(models.Veterinaire).join(
        models.Etablissement,
        models.Veterinaire.id_etablissement == models.Etablissement.id_etablissement
    ).filter(
        models.Etablissement.ville == ville,
        models.Etablissement.est_actif.is_(True)
    ).options(joinedload(models.Veterinaire.etablissement)).all()

    return [
        {
            "id_veterinaire": v.id_veterinaire,
            "nom": v.nom,
            "prenom": v.prenom,
            "telephone": v.telephone,
            "id_etablissement": v.id_etablissement,
            "id_user": v.id_user,
            "etablissement": {
                "id_etablissement": v.etablissement.id_etablissement,
                "nom_etablissement": v.etablissement.nom_etablissement,
                "ville": v.etablissement.ville,
                "adresse": v.etablissement.adresse,
            } if v.etablissement else None
        }
        for v in vetos
    ]

@app.delete("/etablissements/{id_etablissement}")
async def delete_etablissement(id_etablissement: int, db: db_dependency):
    # On vérifie si l'établissement existe
    etablissement = db.query(models.Etablissement).filter(
        models.Etablissement.id_etablissement == id_etablissement
    ).first()
    if not etablissement:
        raise HTTPException(status_code=404, detail="Établissement introuvable")

    # Soft delete: on désactive l'établissement sans casser les vétérinaires liés
    etablissement.est_actif = False
    db.commit()
    
    return {"status": "success", "message": "Établissement désactivé sans suppression physique."}


@app.patch("/etablissements/reactiver/{id_etablissement}")
async def reactivate_etablissement(id_etablissement: int, db: db_dependency):
    etablissement = db.query(models.Etablissement).filter(
        models.Etablissement.id_etablissement == id_etablissement
    ).first()
    if not etablissement:
        raise HTTPException(status_code=404, detail="Établissement introuvable")

    etablissement.est_actif = True
    db.commit()

    return {"status": "success", "message": "Établissement réactivé."}

# ─────────────────────────────────────────────
# VÉTÉRINAIRES
# ─────────────────────────────────────────────

@app.get("/veterinaires/", response_model=List[VeterinaireOut])
def get_all_vets(db: db_dependency):
    try:
        # Récupération directe des objets modèles
        vets = db.query(models.Veterinaire).all()
        return vets
    except Exception as e:
        # Log précis dans ton terminal pour débugger
        print(f"DEBUG ERROR: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="La base de données Railway ne répond pas à temps."
        )
    

@app.get("/veterinaires/me/{user_id}", response_model=VeterinaireOut)
async def get_veto_by_user_id(user_id: int, db: db_dependency):
    """Récupère le profil vétérinaire à partir de l'id_user."""
    veto = db.query(models.Veterinaire).filter(
        models.Veterinaire.id_user == user_id
    ).first()
    if not veto:
        raise HTTPException(status_code=404, detail="Profil vétérinaire introuvable")
    return veto


@app.put("/veterinaires/me/{user_id}", response_model=VeterinaireOut)
async def update_veterinaire(user_id: int, data: VeterinaireUpdate, db: db_dependency):
    """Met à jour le profil vétérinaire identifié par l'id_user."""
    veto = db.query(models.Veterinaire).filter(
        models.Veterinaire.id_user == user_id
    ).first()
    if not veto:
        raise HTTPException(status_code=404, detail="Profil vétérinaire introuvable")

    veto.nom = data.nom
    veto.prenom = data.prenom
    veto.telephone = data.telephone
    veto.id_etablissement = data.id_etablissement

    db.commit()
    db.refresh(veto)
    return veto


@app.post("/veterinaires/", response_model=VeterinaireOut, status_code=201)
async def create_veterinaire(veto: VeterinaireCreate, db: db_dependency):
    try:
        db_veto = models.Veterinaire(**veto.model_dump())
        db.add(db_veto)
        db.commit()
        db.refresh(db_veto)
        return db_veto
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Vous avez déjà un profil vétérinaire.")


# ─────────────────────────────────────────────
# ANIMAUX
# ─────────────────────────────────────────────

@app.post("/animaux/", response_model=AnimalOut, status_code=201)
async def create_animal(animal: AnimalCreate, db: db_dependency):
    try:
        db_animal = models.Animal(**animal.model_dump())
        db.add(db_animal)
        db.commit()
        db.refresh(db_animal)
        return db_animal
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/animaux/proprietaire/{id_proprio}", response_model=List[AnimalOut])
async def get_animaux_by_owner(id_proprio: int, db: db_dependency):
    return db.query(models.Animal).filter(
        models.Animal.id_proprietaire == id_proprio,
        models.Animal.est_actif.is_(True)
    ).all()


@app.put("/animaux/{animal_id}", response_model=AnimalOut)
async def update_animal(animal_id: int, animal_update: AnimalBase, db: db_dependency):
    db_animal = db.query(models.Animal).filter(
        models.Animal.id_animal == animal_id,
        models.Animal.est_actif.is_(True)
    ).first()
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal introuvable")

    for key, value in animal_update.model_dump(exclude_unset=True).items():
        setattr(db_animal, key, value)

    try:
        db.commit()
        db.refresh(db_animal)
        return db_animal
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erreur lors de la mise à jour")


@app.delete("/animaux/{animal_id}", status_code=204)
async def delete_animal(animal_id: int, db: db_dependency):
    db_animal = db.query(models.Animal).filter(
        models.Animal.id_animal == animal_id
    ).first()
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal introuvable")
    db_animal.est_actif = False
    db.commit()


@app.patch("/animaux/reactiver/{animal_id}")
async def reactivate_animal(animal_id: int, db: db_dependency):
    db_animal = db.query(models.Animal).filter(
        models.Animal.id_animal == animal_id
    ).first()
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal introuvable")

    db_animal.est_actif = True
    db.commit()

    return {"status": "success", "message": "Animal réactivé."}


@app.post("/consultations", response_model=ConsultationOut, status_code=201)
async def create_consultation(data: ConsultationCreate, db: db_dependency):
    try:
        animal = db.query(models.Animal).filter(
            models.Animal.id_animal == data.id_animal,
            models.Animal.est_actif.is_(True)
        ).first()
        if not animal:
            raise HTTPException(status_code=404, detail="Animal introuvable ou désactivé")

        new_consult = models.Consultation(
            date_consult=data.date_consult,
            id_animal=data.id_animal,
            id_veterinaire=data.id_veterinaire,
            diagnostic=data.diagnostic
        )
        db.add(new_consult)
        db.commit()
        db.refresh(new_consult)
        return new_consult
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création : {str(e)}")
    


@app.get("/consultations/veterinaire/{id_veto}")
async def get_consultations_veto(id_veto: int, db: db_dependency):
    try:
        # On charge l'animal ET le propriétaire de l'animal pour chaque consultation
        consultations = db.query(models.Consultation)\
            .options(
                joinedload(models.Consultation.animal)\
                .joinedload(models.Animal.proprietaire)
            )\
            .filter(models.Consultation.id_veterinaire == id_veto)\
            .all()

        # Transformation pour s'assurer que le format JSON match exactement ton interface TSX
        return [
            {
                "id_consult": c.id_consult,
                "date_consult": c.date_consult.isoformat(),
                "diagnostic": c.diagnostic,
                "animal": {
                    "id_animal": c.animal.id_animal,
                    "nom_animal": c.animal.nom_animal,
                    "espece": c.animal.espece,
                    "race": c.animal.race,
                    "age": c.animal.age,
                    "poids_kg": c.animal.poids_kg
                } if c.animal else None,
                "proprietaire": {
                    "nom": c.animal.proprietaire.nom,
                    "prenom": c.animal.proprietaire.prenom,
                    "telephone": c.animal.proprietaire.telephone,
                    "mail": db.query(models.CompteUser.mail).filter(models.CompteUser.id_user == c.animal.proprietaire.id_user).scalar() 
                } if (c.animal and c.animal.proprietaire) else None
            }
            for c in consultations
        ]
    except Exception as e:
        print(f"Erreur SQL: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des données complexes.")
    

@app.get("/consultations/animal/{id_animal}")
async def get_consultations_with_prescriptions(id_animal: int, db: db_dependency):
    # Requête SQL complexe avec JOIN pour récupérer l'acte et les médicaments associés
    query = text("""
        SELECT 
            c.id_consult, 
            c.date_consult, 
            c.diagnostic,
            m.nom_medicament,
            p.posologie,
            p.duree_traitement
        FROM consultations c
        LEFT JOIN prescriptions p ON c.id_consult = p.id_consult
        LEFT JOIN medicaments m ON p.id_medicament = m.id_medicament
        WHERE c.id_animal = :id_animal
        ORDER BY c.date_consult DESC
    """)
    
    result = db.execute(query, {"id_animal": id_animal})
    rows = result.mappings().all()

    # Logique pour regrouper les prescriptions par consultation
    consultations_dict = {}
    for row in rows:
        id_c = row["id_consult"]
        if id_c not in consultations_dict:
            consultations_dict[id_c] = {
                "id_consult": id_c,
                "date_consult": row["date_consult"],
                "diagnostic": row["diagnostic"],
                "prescriptions": []
            }
        
        # On ajoute la prescription seulement s'il y a un médicament associé
        if row["nom_medicament"]:
            consultations_dict[id_c]["prescriptions"].append({
                "nom_medicament": row["nom_medicament"],
                "posologie": row["posologie"],
                "duree_traitement": row["duree_traitement"]
            })

    return list(consultations_dict.values())



@app.get("/consultations/proprietaire/{id_proprio}")
async def get_consultations_proprio(id_proprio: int, db: db_dependency):
    # On cherche les consultations liées aux animaux appartenant à ce propriétaire
    consultations = db.query(models.Consultation)\
        .join(models.Animal)\
        .filter(models.Animal.id_proprietaire == id_proprio)\
        .options(joinedload(models.Consultation.animal), joinedload(models.Consultation.veterinaire))\
        .all()

    return [
        {
            "id_consult": c.id_consult,
            "date_consult": c.date_consult.isoformat(),
            "diagnostic": c.diagnostic,
            "animal": {
                "nom_animal": c.animal.nom_animal,
                "espece": c.animal.espece
            } if c.animal else None,
            "veterinaire": {
                "nom": c.veterinaire.nom,
                "prenom": c.veterinaire.prenom
            } if c.veterinaire else None
        } for c in consultations
    ]

@app.put("/consultations/{id_consult}/diagnostic")
async def update_diagnostic(id_consult: int, diagnostic_data: dict, db: db_dependency):
    # On récupère la consultation
    consultation = db.query(models.Consultation).filter(models.Consultation.id_consult == id_consult).first()
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation non trouvée")
    
    # On met à jour le diagnostic
    new_diag = diagnostic_data.get("diagnostic")
    if not new_diag:
        raise HTTPException(status_code=400, detail="Le diagnostic ne peut pas être vide")
        
    consultation.diagnostic = new_diag
    db.commit()
    
    return {"status": "success", "message": "Diagnostic mis à jour", "diagnostic": new_diag}


# --- ROUTES MÉDICAMENTS ---
@app.get("/medicaments")
async def get_all_medicaments(db: db_dependency):
    return db.query(models.Medicament).all()

# --- ROUTES PRESCRIPTIONS ---
@app.post("/prescriptions")
async def create_prescription(data: dict, db: db_dependency):
    # On crée la liaison entre la consultation et le médicament
    new_presc = models.Prescription(
        id_consult=data.get("id_consult"),
        id_medicament=data.get("id_medicament"),
        posologie=data.get("posologie"),
        duree_traitement=data.get("duree_traitement")
    )
    db.add(new_presc)
    db.commit()
    return {"status": "success"}

@app.get("/consultations/{id_consult}/prescriptions", response_model=List[PrescriptionOut])
async def get_prescriptions(id_consult: int, db: db_dependency):
    return db.query(models.Prescription)\
        .options(joinedload(models.Prescription.medicament))\
        .filter(models.Prescription.id_consult == id_consult).all()


from sqlalchemy import text

@app.post("/admin/query")
async def execute_raw_query(request: QueryRequest, db: db_dependency):
    try:
        result = db.execute(text(request.sql_query))
        
        if result.returns_rows:
            rows = result.mappings().all()
            return {"results": [dict(row) for row in rows]}
        else:
            db.commit()
            return {"results": [], "message": f"Succès : {result.rowcount} ligne(s) affectée(s)."}
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@app.get("/admin/stats")
async def get_admin_stats(db: db_dependency):
    # Comptes simples pour le tableau de bord
    nb_animaux = db.execute(text("SELECT COUNT(*) FROM animaux")).scalar()
    nb_proprios = db.execute(text("SELECT COUNT(*) FROM proprietaires")).scalar()
    nb_vetos = db.execute(text("SELECT COUNT(*) FROM veterinaires")).scalar()
    nb_cliniques = db.execute(text("SELECT COUNT(*) FROM etablissements")).scalar()
    
    # Statistique pertinente : Top 3 des espèces les plus suivies (Exigence Statistique Globale)
    query_top_especes = text("""
        SELECT espece, COUNT(*) as count 
        FROM animaux 
        GROUP BY espece 
        ORDER BY count DESC 
        LIMIT 3
    """)
    top_especes = db.execute(query_top_especes).mappings().all()

    return {
        "counts": {
            "animaux": nb_animaux,
            "proprietaires": nb_proprios,
            "veterinaires": nb_vetos,
            "etablissements": nb_cliniques
        },
        "top_especes": top_especes
    }


@app.get("/{category}")
async def get_all_from_category(category: str, db: db_dependency):
    # Sécurité : on vérifie que la table demandée est autorisée
    allowed_tables = ["animaux", "proprietaires", "veterinaires", "etablissements", "medicaments"]
    
    if category not in allowed_tables:
        raise HTTPException(status_code=404, detail="Table non trouvée")
    
    if category == "proprietaires":
        query = text("""
            SELECT p.*, cu.est_actif AS est_actif
            FROM proprietaires p
            JOIN compte_users cu ON cu.id_user = p.id_user
        """)
    elif category == "animaux":
        query = text("""
            SELECT a.*, cu.est_actif AS proprietaire_actif
            FROM animaux a
            LEFT JOIN proprietaires p ON p.id_proprietaire = a.id_proprietaire
            LEFT JOIN compte_users cu ON cu.id_user = p.id_user
        """)
    elif category == "veterinaires":
        query = text("""
            SELECT v.*, cu.est_actif AS est_actif
            FROM veterinaires v
            JOIN compte_users cu ON cu.id_user = v.id_user
        """)
    else:
        query = text(f"SELECT * FROM {category}")
    try:
        result = db.execute(query).mappings().all()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/{category}/search")
async def dynamic_search(category: str, column: str, db: db_dependency, q : str = "", ):
    allowed_columns = {
        "animaux": ["nom_animal", "espece", "race", "age", "id_animal"],
        "proprietaires": ["nom", "prenom", "telephone", "id_proprietaire"],
        "veterinaires": ["nom", "prenom", "telephone", "id_veterinaire"],
        "etablissements": ["nom_etablissement", "ville"],
        "medicaments": ["nom_medicament"]
    }

    if category not in allowed_columns or column not in allowed_columns[category]:
        raise HTTPException(status_code=400, detail="Critère invalide")

    # Si q est vide, on fait un SELECT * simple
    if not q.strip():
        if category == "proprietaires":
            query = text("""
                SELECT p.*, cu.est_actif AS est_actif
                FROM proprietaires p
                JOIN compte_users cu ON cu.id_user = p.id_user
            """)
        elif category == "animaux":
            query = text("""
                SELECT a.*, cu.est_actif AS proprietaire_actif
                FROM animaux a
                LEFT JOIN proprietaires p ON p.id_proprietaire = a.id_proprietaire
                LEFT JOIN compte_users cu ON cu.id_user = p.id_user
            """)
        elif category == "veterinaires":
            query = text("""
                SELECT v.*, cu.est_actif AS est_actif
                FROM veterinaires v
                JOIN compte_users cu ON cu.id_user = v.id_user
            """)
        else:
            query = text(f"SELECT * FROM {category}")
        return db.execute(query).mappings().all()

    # Sinon, on applique le filtre LIKE
    if category == "proprietaires":
        query = text(f"""
            SELECT p.*, cu.est_actif AS est_actif
            FROM proprietaires p
            JOIN compte_users cu ON cu.id_user = p.id_user
            WHERE p.{column} LIKE :val
        """)
    elif category == "animaux":
        query = text(f"""
            SELECT a.*, cu.est_actif AS proprietaire_actif
            FROM animaux a
            LEFT JOIN proprietaires p ON p.id_proprietaire = a.id_proprietaire
            LEFT JOIN compte_users cu ON cu.id_user = p.id_user
            WHERE a.{column} LIKE :val
        """)
    elif category == "veterinaires":
        query = text(f"""
            SELECT v.*, cu.est_actif AS est_actif
            FROM veterinaires v
            JOIN compte_users cu ON cu.id_user = v.id_user
            WHERE v.{column} LIKE :val
        """)
    else:
        query = text(f"SELECT * FROM {category} WHERE {column} LIKE :val")
    return db.execute(query, {"val": f"%{q}%"}).mappings().all()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
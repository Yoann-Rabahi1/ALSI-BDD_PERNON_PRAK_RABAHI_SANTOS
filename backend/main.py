from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Annotated
import models
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal, get_db
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from schema import *

app = FastAPI(title="API Clinique Vétérinaire - ALSI61")
models.Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
    user = db.query(models.CompteUser).filter(models.CompteUser.mail == credentials.mail).first()

    if not user or user.mot_de_passe != credentials.mot_de_passe:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    user_data = {
        "id_user": user.id_user,
        "mail": user.mail,
        "role": user.role, # Ce sera maintenant 'veto' après l'UPDATE SQL
        "has_profile": False
    }

    if user.role == "veto":
        veto = db.query(models.Veterinaire).filter(models.Veterinaire.id_user == user.id_user).first()
        if veto and veto.nom and veto.nom.strip() not in ["", "À compléter"]:
            user_data["has_profile"] = True
            user_data["id_veterinaire"] = veto.id_veterinaire
            user_data["nom"] = veto.nom
            user_data["prenom"] = veto.prenom
    
    elif user.role == "client":
        proprio = db.query(models.Proprietaire).filter(models.Proprietaire.id_user == user.id_user).first()
        if proprio and proprio.nom and proprio.nom.strip() not in ["", "À compléter"]:
            user_data["has_profile"] = True
            user_data["id_proprietaire"] = proprio.id_proprietaire
            user_data["nom"] = proprio.nom
            user_data["prenom"] = proprio.prenom

    return {"status": "success", "user": user_data}
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
    if data.id_etablissement is not None:
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
        models.Animal.id_proprietaire == id_proprio
    ).all()


@app.put("/animaux/{animal_id}", response_model=AnimalOut)
async def update_animal(animal_id: int, animal_update: AnimalBase, db: db_dependency):
    db_animal = db.query(models.Animal).filter(
        models.Animal.id_animal == animal_id
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
    db.delete(db_animal)
    db.commit()


@app.post("/consultations", response_model=ConsultationOut, status_code=201)
async def create_consultation(data: ConsultationCreate, db: db_dependency):
    try:
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
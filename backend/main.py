from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Annotated
import models
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal, get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from schema import *

app = FastAPI(title="API Clinique Vétérinaire - ALSI61")
models.Base.metadata.create_all(bind=engine)


origins = [
    "http://localhost:5173",    # Ton adresse React en local
    "http://127.0.0.1:5173",    # Alternative locale
    # Ajoute ici l'URL de ton front une fois déployé sur Vercel/Netlify plus tard
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # L'adresse de ton frontend Vite
    allow_credentials=True,
    allow_methods=["*"], # Autorise tous les types de requêtes (GET, POST, etc.)
    allow_headers=["*"], # Autorise tous les headers
)

db_dependency = Annotated[Session, Depends(get_db)]

@app.get("/ping")
async def ping():
    return {"status": "ok", "message": "Le serveur répond !"}


@app.post("/signup-full")
async def signup_full(data: UserSignup, db: db_dependency):
    try:
        # 1. Création du compte_user
        new_user = models.CompteUser(
            mail=data.mail,
            mot_de_passe=data.mot_de_passe,
            role=data.role
        )
        db.add(new_user)
        db.flush() # Récupère l'ID généré sans commiter définitivement

        # 2. Création automatique du profil associé
        if data.role == "client":
            new_profile = models.Proprietaire(
                id_user=new_user.id_user,
                nom=data.nom,
                prenom=data.prenom,
                telephone=data.telephone
            )
            db.add(new_profile)
        
        db.commit()
        return {"message": "Compte et profil créés avec succès", "userId": new_user.id_user}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erreur inscription: {str(e)}")

@app.post("/users/", response_model=CompteUser)
async def create_user(user: CompteUserCreate, db: db_dependency):
    try:
        db_user = models.CompteUser(**user.model_dump())
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        if db_user.role == "client":
            new_proprio = models.Proprietaire(
                id_user=db_user.id_user,
                nom="À compléter",
                prenom="À compléter",
                telephone="0000000000"
            )
            db.add(new_proprio)
            db.commit()

        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/proprietaires/")
async def create_proprietaire(proprio: ProprietaireCreate, db: db_dependency):
    try:
        db_proprio = models.Proprietaire(**proprio.model_dump())
        db.add(db_proprio)
        db.commit()
        return db_proprio
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Vous avez déjà un profil propriétaire.")


@app.get("/users/{user_id}", response_model=CompteUser)
async def read_user(user_id : int, db:db_dependency):
    user = db.query(models.CompteUser).filter(models.CompteUser.id_user == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="L'utilisateur n'est pas trouvé")
    return user

# Route
@app.post("/animaux/")
async def create_animal(animal: AnimalCreate, db: db_dependency):
    try:
        db_animal = models.Animal(
            nom_animal=animal.nom_animal,
            espece=animal.espece,
            race=animal.race,
            age=animal.age,
            poids_kg=animal.poids_kg,
            id_proprietaire=animal.id_proprietaire 
        )
        db.add(db_animal)
        db.commit()
        db.refresh(db_animal)
        return db_animal
    except Exception as e:
        db.rollback()
        print(f"ERREUR SQL : {e}") 
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
async def login(credentials: dict, db: db_dependency):

    email = credentials.get("mail")
    password = credentials.get("mot_de_passe")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email et mot de passe requis")

    user = db.query(models.CompteUser).filter(models.CompteUser.mail == email).first()

    if not user or user.mot_de_passe != password:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    return {
        "status": "success",
        "user": {
            "id_user": user.id_user,
            "mail": user.mail,
            "role": user.role
        }
    }

@app.put("/proprietaires/{user_id}")
async def update_proprietaire(user_id: int, proprio_data: ProprietaireCreate, db: db_dependency):
    db_proprio = db.query(models.Proprietaire).filter(models.Proprietaire.id_user == user_id).first()
    
    if not db_proprio:
        raise HTTPException(status_code=404, detail="Profil non trouvé")
        
    db_proprio.nom = proprio_data.nom
    db_proprio.prenom = proprio_data.prenom
    db_proprio.telephone = proprio_data.telephone
    
    db.commit()
    db.refresh(db_proprio)
    return db_proprio

@app.get("/proprietaires/me/{user_id}")
async def get_owner_by_user_id(user_id: int, db: db_dependency):
    # ATTENTION : On filtre sur la colonne id_user, pas id_proprietaire
    owner = db.query(models.Proprietaire).filter(models.Proprietaire.id_user == user_id).first()
    
    if not owner:
        raise HTTPException(status_code=404, detail="Profil propriétaire introuvable pour cet utilisateur")
        
    return owner 

@app.put("/animaux/{animal_id}", response_model=AnimalOut)
async def update_animal(animal_id: int, animal_update:AnimalBase, db: db_dependency):
    # 1. On cherche l'animal en base
    db_animal = db.query(models.Animal).filter(models.Animal.id_animal == animal_id).first()
    
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal introuvable")

    # 2. On transforme le schéma Pydantic en dictionnaire
    # exclude_unset=True permet de ne mettre à jour que les champs envoyés
    update_data = animal_update.model_dump(exclude_unset=True)

    # 3. On applique les changements à l'objet SQLAlchemy
    for key, value in update_data.items():
        setattr(db_animal, key, value)

    try:
        db.commit()      # On valide la transaction
        db.refresh(db_animal) # On recharge l'objet pour avoir les données fraîches
        return db_animal
    except Exception as e:
        db.rollback()
        print(f"Erreur SQL : {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la mise à jour en base de données")

@app.get("/animaux/proprietaire/{id_proprio}", response_model=List[AnimalOut]) 
async def get_animaux_by_owner(id_proprio: int, db: db_dependency):
    animaux = db.query(models.Animal).filter(models.Animal.id_proprietaire == id_proprio).all()
    return animaux
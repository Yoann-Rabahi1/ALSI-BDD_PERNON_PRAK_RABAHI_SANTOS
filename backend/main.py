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


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # L'adresse de ton frontend Vite
    allow_credentials=True,
    allow_methods=["*"], # Autorise tous les types de requêtes (GET, POST, etc.)
    allow_headers=["*"], # Autorise tous les headers
)

db_dependency = Annotated[Session, Depends(get_db)]

@app.get("/ping")
async def ping():
    return {"status": "ok", "message": "Le serveur répond !"}

@app.post("/users/", response_model=CompteUser)
async def create_user(user: CompteUserCreate, db: db_dependency):
    try:
        db_user = models.CompteUser(**user.model_dump())
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback() # Très important pour débloquer la session
        raise HTTPException(status_code=400, detail="Cet email est déjà enregistré.")
    except Exception as e:
        db.rollback()
        print(f"ERREUR SERVEUR: {e}") # Regarde ton terminal pour lire ça
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
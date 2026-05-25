from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Annotated
import models
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal, get_db
from sqlalchemy.orm import Session
from schema import *

app = FastAPI(title="API Clinique Vétérinaire - ALSI61")
models.Base.metadata.create_all(bind=engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

db_dependency = Annotated[Session, Depends(get_db)]

@app.post("/users/", response_model=CompteUser)
async def create_user(user: CompteUserCreate, db:db_dependency):
    db_user = models.CompteUser(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/{user_id}", response_model=CompteUser)
async def read_user(user_id : int, db:db_dependency):
    user = db.query(models.CompteUser).filter(models.CompteUser.id_user == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="L'utilisateur n'est pas trouvé")
    return user
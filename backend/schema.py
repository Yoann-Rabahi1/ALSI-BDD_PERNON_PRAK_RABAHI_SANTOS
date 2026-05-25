from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- SCHÉMAS COMPTE USER ---
class CompteUserBase(BaseModel):
    mail: EmailStr
    role: str = "client"
    est_actif: bool = True

class CompteUserCreate(CompteUserBase):
    mot_de_passe: str

class CompteUser(CompteUserBase):
    id_user: int
    class Config:
        from_attributes = True


# Schéma combiné pour l'inscription
class UserSignup(BaseModel):
    mail: str
    mot_de_passe: str
    role: str
    nom: str
    prenom: str
    telephone: str

# --- SCHÉMAS ÉTABLISSEMENT ---
class EtablissementBase(BaseModel):
    nom_etablissement: str
    ville: str
    adresse: str

class Etablissement(EtablissementBase):
    id_etablissement: int
    class Config:
        from_attributes = True



# --- SCHÉMAS ANIMAL ---

class AnimalBase(BaseModel):
    nom_animal: str
    espece: Optional[str] = None
    race: Optional[str] = None
    age: Optional[int] = None
    poids_kg: Optional[float] = None

class AnimalCreate(AnimalBase):
    id_proprietaire: int 

class AnimalOut(AnimalBase):
    id_animal: int
    id_proprietaire: int
    
    model_config = ConfigDict(from_attributes=True)


# --- SCHÉMAS PROPRIÉTAIRE ---

class ProprietaireBase(BaseModel):
    nom: str
    prenom: str
    telephone: str
    id_user: int

class ProprietaireCreate(ProprietaireBase):
    pass

class ProprietaireOut(ProprietaireBase):
    id_proprietaire: int
    

    model_config = ConfigDict(from_attributes=True)
# --- SCHÉMAS VÉTÉRINAIRE ---
class VeterinaireBase(BaseModel):
    nom: str
    prenom: str
    id_etablissement: Optional[int] = None
    id_user: int

class Veterinaire(VeterinaireBase):
    id_veterinaire: int
    class Config:
        from_attributes = True

# --- SCHÉMAS CONSULTATION ---
class ConsultationBase(BaseModel):
    date_consult: datetime
    diagnostic: Optional[str] = None
    id_animal: int
    id_veterinaire: int

class Consultation(ConsultationBase):
    id_consult: int
    class Config:
        from_attributes = True

# --- SCHÉMAS MÉDICAMENT ---
class MedicamentBase(BaseModel):
    nom_medicament: str
    description: Optional[str] = None
    prix_unitaire: float

class Medicament(MedicamentBase):
    id_medicament: int
    class Config:
        from_attributes = True
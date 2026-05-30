from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime


# ─────────────────────────────────────────────
# COMPTE USER
# ─────────────────────────────────────────────

class CompteUserBase(BaseModel):
    mail: EmailStr
    role: str = "client"
    est_actif: bool = True

class CompteUserCreate(CompteUserBase):
    mot_de_passe: str

class CompteUserOut(CompteUserBase):
    id_user: int
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    mail: str
    mot_de_passe: str


# ─────────────────────────────────────────────
# INSCRIPTION UNIFIÉE
# Regroupe compte + profil en un seul payload
# ─────────────────────────────────────────────

class UserSignupFull(BaseModel):
    mail: EmailStr
    mot_de_passe: str
    role: str = "client"          # "client" ou "veto"
    nom: str
    prenom: str
    telephone: str = "0000000000"  # Optionnel pour les vetos


# ─────────────────────────────────────────────
# PROPRIÉTAIRE
# ─────────────────────────────────────────────

class ProprietaireBase(BaseModel):
    nom: str
    prenom: str
    telephone: str

class ProprietaireCreate(ProprietaireBase):
    id_user: int

class ProprietaireUpdate(ProprietaireBase):
    """Payload pour mettre à jour un profil proprio (sans id_user, il vient de l'URL)."""
    pass

class ProprietaireOut(ProprietaireBase):
    id_proprietaire: int
    id_user: int
    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# VÉTÉRINAIRE
# ─────────────────────────────────────────────

class VeterinaireBase(BaseModel):
    nom: str
    prenom: str
    telephone : str
    id_etablissement: Optional[int] = None

class VeterinaireCreate(VeterinaireBase):
    id_user: int

class VeterinaireUpdate(VeterinaireBase):
    """Payload pour mettre à jour un profil veto (sans id_user, il vient de l'URL)."""
    pass

class VeterinaireOut(VeterinaireBase):
    id_veterinaire: int
    id_user: int
    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# ÉTABLISSEMENT
# ─────────────────────────────────────────────

class EtablissementBase(BaseModel):
    nom_etablissement: str
    ville: str
    adresse: str

class EtablissementOut(EtablissementBase):
    id_etablissement: int
    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# ANIMAL
# ─────────────────────────────────────────────

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


# ─────────────────────────────────────────────
# CONSULTATION
# ─────────────────────────────────────────────

class ConsultationBase(BaseModel):
    date_consult: datetime
    id_animal: int
    id_veterinaire: int

class ConsultationOut(ConsultationBase):
    id_consult: int
    model_config = ConfigDict(from_attributes=True)


class ConsultationCreate(BaseModel):
    date_consult: datetime
    id_animal: int
    diagnostic: str = "en attente"
    id_veterinaire: int
    id_proprietaire: int   # Pour vérifier que l\'animal appartient bien au proprio

class ConsultationOut(BaseModel):
    id_consult: int
    date_consult: datetime
    diagnostic: str
    id_animal: int
    id_veterinaire: int
    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# MÉDICAMENT
# ─────────────────────────────────────────────

# Dans schemas.py
class MedicamentBase(BaseModel):
    id_medicament: int
    nom_medicament: str
    prix_unitaire: float
    description: Optional[str] = None

    class Config:
        from_attributes = True

class PrescriptionOut(BaseModel):
    id_prescription: int
    posologie: str
    duree_traitement: str
    medicament: MedicamentBase # C'est ici que la magie opère

    class Config:
        from_attributes = True
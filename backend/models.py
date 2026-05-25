from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DECIMAL, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from database import Base

# 1. TABLE COMPTE_USER
class CompteUser(Base):
    __tablename__ = "compte_users" # Harmonisé en minuscules
    id_user = Column(Integer, primary_key=True, index=True)
    mail = Column(String(100), unique=True, nullable=False)
    mot_de_passe = Column(String(255), nullable=False)
    est_actif = Column(Boolean, default=True)
    role = Column(Enum('admin', 'veto', 'client', name='user_roles'), default='client')

# 2. TABLE ETABLISSEMENT
class Etablissement(Base):
    __tablename__ = "etablissements"
    id_etablissement = Column(Integer, primary_key=True, index=True)
    nom_etablissement = Column(String(75))
    ville = Column(String(75))
    adresse = Column(String(75))

# 3. TABLE ANIMAL
class Animal(Base):
    __tablename__ = "animaux"
    id_animal = Column(Integer, primary_key=True, index=True)
    nom_animal = Column(String(75), nullable=False)
    espece = Column(String(50))
    race = Column(String(50))
    age = Column(Integer)
    poids_kg = Column(DECIMAL(5, 2))

    # Ajout du lien vers proprietaire pour back_populates
    proprietaire = relationship("Proprietaire", back_populates="animal")

# 4. TABLE VETERINAIRE
class Veterinaire(Base):
    __tablename__ = "veterinaires"
    id_veterinaire = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), nullable=False)
    prenom = Column(String(50), nullable=False)
    id_etablissement = Column(Integer, ForeignKey("etablissements.id_etablissement"), nullable=True)
    id_user = Column(Integer, ForeignKey("compte_users.id_user"), nullable=False)

    etablissement = relationship("Etablissement")
    compte = relationship("CompteUser")

# 5. TABLE PROPRIETAIRE
class Proprietaire(Base):
    __tablename__ = "proprietaires"
    id_proprietaire = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50))
    prenom = Column(String(50))
    telephone = Column(String(15))
    
    # Correction des FK pour qu'elles matchent les __tablename__
    id_animal = Column(Integer, ForeignKey("animaux.id_animal"), nullable=True)
    id_user = Column(Integer, ForeignKey("compte_users.id_user"), unique=True)

    animal = relationship("Animal", back_populates="proprietaire")
    user = relationship("CompteUser")

# 6. TABLE MEDICAMENT
class Medicament(Base):
    __tablename__ = "medicaments"
    id_medicament = Column(Integer, primary_key=True, index=True)
    nom_medicament = Column(String(100), nullable=False)
    description = Column(Text)
    prix_unitaire = Column(DECIMAL(10, 2), nullable=False)

# 7. TABLE CONSULTATION
class Consultation(Base):
    __tablename__ = "consultations"
    id_consult = Column(Integer, primary_key=True, index=True)
    date_consult = Column(DateTime, nullable=False)
    diagnostic = Column(Text)
    # Correction de la FK (doit être le nom de la table 'animaux')
    id_animal = Column(Integer, ForeignKey("animaux.id_animal"), nullable=False)
    id_veterinaire = Column(Integer, ForeignKey("veterinaires.id_veterinaire"), nullable=False)

    animal = relationship("Animal")
    veterinaire = relationship("Veterinaire")

# 8. TABLE PRESCRIPTION
class Prescription(Base):
    __tablename__ = "prescriptions"
    id_prescription = Column(Integer, primary_key=True, index=True)
    id_consult = Column(Integer, ForeignKey("consultations.id_consult"), nullable=False)
    id_medicament = Column(Integer, ForeignKey("medicaments.id_medicament"), nullable=False)
    posologie = Column(String(255))
    duree_traitement = Column(String(50))

    consultation = relationship("Consultation")
    medicament = relationship("Medicament")
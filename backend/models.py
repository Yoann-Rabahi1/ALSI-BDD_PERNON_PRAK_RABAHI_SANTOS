from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DECIMAL, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from database import Base

# 1. TABLE COMPTE_USER
class CompteUser(Base):
    __tablename__ = "Compte_User"
    id_user = Column(Integer, primary_key=True, index=True)
    mail = Column(String(100), unique=True, nullable=False)
    mot_de_passe = Column(String(255), nullable=False)
    est_actif = Column(Boolean, default=True)
    role = Column(Enum('admin', 'veto', 'client'), default='client')

# 2. TABLE ETABLISSEMENT
class Etablissement(Base):
    __tablename__ = "Etablissement"
    id_etablissement = Column(Integer, primary_key=True, index=True)
    nom_etablissement = Column(String(75))
    ville = Column(String(75))
    adresse = Column(String(75))

# 3. TABLE ANIMAL
class Animal(Base):
    __tablename__ = "Animal"
    id_animal = Column(Integer, primary_key=True, index=True)
    nom_animal = Column(String(75), nullable=False)
    espece = Column(String(50))
    race = Column(String(50))
    age = Column(Integer)
    poids_kg = Column(DECIMAL(5, 2))

# 4. TABLE VETERINAIRE
class Veterinaire(Base):
    __tablename__ = "Veterinaire"
    id_veterinaire = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), nullable=False)
    prenom = Column(String(50), nullable=False)
    id_etablissement = Column(Integer, ForeignKey("Etablissement.id_etablissement"), nullable=True)
    id_user = Column(Integer, ForeignKey("Compte_User.id_user"), nullable=False)

    # Relations
    etablissement = relationship("Etablissement")
    compte = relationship("CompteUser")

# 5. TABLE PROPRIETAIRE
class Proprietaire(Base):
    __tablename__ = "Proprietaire"
    id_proprio = Column(Integer, primary_key=True, index=True)
    nom = Column(String(75), nullable=False)
    prenom = Column(String(75), nullable=False)
    telephone = Column(String(20))
    id_animal = Column(Integer, ForeignKey("Animal.id_animal"), nullable=False)
    id_user = Column(Integer, ForeignKey("Compte_User.id_user"), nullable=False)

    animal = relationship("Animal")
    compte = relationship("CompteUser")

# 6. TABLE MEDICAMENT
class Medicament(Base):
    __tablename__ = "Medicament"
    id_medicament = Column(Integer, primary_key=True, index=True)
    nom_medicament = Column(String(100), nullable=False)
    description = Column(Text)
    prix_unitaire = Column(DECIMAL(10, 2), nullable=False)

# 7. TABLE CONSULTATION
class Consultation(Base):
    __tablename__ = "Consultation"
    id_consult = Column(Integer, primary_key=True, index=True)
    date_consult = Column(DateTime, nullable=False)
    diagnostic = Column(Text)
    id_animal = Column(Integer, ForeignKey("Animal.id_animal"), nullable=False)
    id_veterinaire = Column(Integer, ForeignKey("Veterinaire.id_veterinaire"), nullable=False)

    animal = relationship("Animal")
    veterinaire = relationship("Veterinaire")

# 8. TABLE PRESCRIPTION
class Prescription(Base):
    __tablename__ = "Prescription"
    id_prescription = Column(Integer, primary_key=True, index=True)
    id_consult = Column(Integer, ForeignKey("Consultation.id_consult"), nullable=False)
    id_medicament = Column(Integer, ForeignKey("Medicament.id_medicament"), nullable=False)
    posologie = Column(String(255))
    duree_traitement = Column(String(50))

    consultation = relationship("Consultation")
    medicament = relationship("Medicament")
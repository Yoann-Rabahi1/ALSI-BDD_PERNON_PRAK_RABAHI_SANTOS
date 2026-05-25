CREATE DATABASE IF NOT EXISTS railway;
USE railway;

-- 1. Tables parentes (sans dépendances)
CREATE TABLE IF NOT EXISTS Compte_User (
    id_user INT PRIMARY KEY AUTO_INCREMENT,
    mail VARCHAR(100) UNIQUE NOT NULL, 
    mot_de_passe VARCHAR(255) NOT NULL,
    est_actif BOOLEAN DEFAULT 1,
    role ENUM('admin', 'veto', 'client') DEFAULT 'client' 
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Etablissement (
    id_etablissement INT PRIMARY KEY AUTO_INCREMENT,
    nom_etablissement VARCHAR(75),
    ville VARCHAR(75),
    adresse VARCHAR(75)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Animal (
    id_animal INT PRIMARY KEY AUTO_INCREMENT,
    nom_animal VARCHAR(75) NOT NULL,
    espece VARCHAR(50),
    race VARCHAR(50),
    age INT,
    poids_kg DECIMAL(5,2)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Medicament (
    id_medicament INT PRIMARY KEY AUTO_INCREMENT,
    nom_medicament VARCHAR(100) NOT NULL,
    description TEXT,
    prix_unitaire DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB;

-- 2. Tables avec clés étrangères simples
CREATE TABLE IF NOT EXISTS Veterinaire (
    id_veterinaire INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    id_etablissement INT NULL,
    id_user INT NOT NULL,
    FOREIGN KEY (id_etablissement) REFERENCES Etablissement(id_etablissement) ON DELETE SET NULL,
    FOREIGN KEY (id_user) REFERENCES Compte_User(id_user) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Proprietaire (
    id_proprio INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(75) NOT NULL,
    prenom VARCHAR(75) NOT NULL,
    telephone VARCHAR(20),
    id_animal INT NOT NULL,
    id_user INT NOT NULL,
    FOREIGN KEY (id_animal) REFERENCES Animal(id_animal) ON DELETE RESTRICT,
    FOREIGN KEY (id_user) REFERENCES Compte_User(id_user) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. Tables de l'activité (Consultation)
CREATE TABLE IF NOT EXISTS Consultation (
    id_consult INT PRIMARY KEY AUTO_INCREMENT,
    date_consult DATETIME NOT NULL,
    diagnostic TEXT,
    id_animal INT NOT NULL,
    id_veterinaire INT NOT NULL,
    FOREIGN KEY (id_animal) REFERENCES Animal(id_animal) ON DELETE RESTRICT,
    FOREIGN KEY (id_veterinaire) REFERENCES Veterinaire(id_veterinaire) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Medicament (
    id_medicament INT PRIMARY KEY AUTO_INCREMENT,
    nom_medicament VARCHAR(100) NOT NULL,
    description TEXT, -- Pour les détails sur l'usage du médicament
    prix_unitaire DECIMAL(10,2) NOT NULL -- DECIMAL est plus précis que FLOAT pour l'argent
) ENGINE=InnoDB;

-- 4. Table finale (Prescription)
CREATE TABLE IF NOT EXISTS Prescription (
    id_prescription INT PRIMARY KEY AUTO_INCREMENT,
    id_consult INT NOT NULL,
    id_medicament INT NOT NULL,
    posologie VARCHAR(255),
    duree_traitement VARCHAR(50),
    FOREIGN KEY (id_consult) REFERENCES Consultation(id_consult) ON DELETE CASCADE,
    FOREIGN KEY (id_medicament) REFERENCES Medicament(id_medicament) ON DELETE RESTRICT
) ENGINE=InnoDB;
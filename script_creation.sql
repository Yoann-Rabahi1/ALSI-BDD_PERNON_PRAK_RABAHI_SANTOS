CREATE DATABASE IF NOT EXISTS railway;

USE railway;

CREATE TABLE IF NOT EXISTS compte_users (
    id_user INT PRIMARY KEY AUTO_INCREMENT,
    mail VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    est_actif BOOLEAN DEFAULT 1,
    role ENUM('admin', 'veto', 'client') DEFAULT 'client'
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS etablissements (
    id_etablissement INT PRIMARY KEY AUTO_INCREMENT,
    nom_etablissement VARCHAR(75),
    ville VARCHAR(75),
    adresse VARCHAR(75),
    est_actif BOOLEAN DEFAULT 1
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS veterinaires (
    id_veterinaire INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    id_etablissement INT NULL,
    id_user INT NOT NULL,
    telephone VARCHAR(20),
    FOREIGN KEY (id_etablissement) REFERENCES etablissements (id_etablissement) ON DELETE RESTRICT,
    FOREIGN KEY (id_user) REFERENCES compte_users (id_user) ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS proprietaires (
    id_proprietaire INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(75) NOT NULL,
    prenom VARCHAR(75) NOT NULL,
    telephone VARCHAR(20),
    id_user INT NOT NULL,
    FOREIGN KEY (id_user) REFERENCES compte_users (id_user) ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS animaux (
    id_animal INT PRIMARY KEY AUTO_INCREMENT,
    nom_animal VARCHAR(75) NOT NULL,
    espece VARCHAR(50),
    race VARCHAR(50),
    age INT CHECK(age>=0),
    poids_kg DECIMAL(5,2) DEFAULT 0.00 CHECK (poids_kg >= 0),
    id_proprietaire INT NOT NULL,
    FOREIGN KEY (id_proprietaire) REFERENCES proprietaires (id_proprietaire) ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS medicaments (
    id_medicament INT PRIMARY KEY AUTO_INCREMENT,
    nom_medicament VARCHAR(100) NOT NULL,
    description TEXT,
    prix_unitaire DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (prix_unitaire >= 0)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS consultations (
    id_consult INT PRIMARY KEY AUTO_INCREMENT,
    date_consult DATETIME NOT NULL,
    diagnostic TEXT,
    id_animal INT NOT NULL,
    id_veterinaire INT NOT NULL,
    FOREIGN KEY (id_animal) REFERENCES animaux (id_animal) ON DELETE RESTRICT,
    FOREIGN KEY (id_veterinaire) REFERENCES veterinaires (id_veterinaire) ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS prescriptions (
    id_prescription INT PRIMARY KEY AUTO_INCREMENT,
    id_consult INT NOT NULL,
    id_medicament INT NOT NULL,
    posologie VARCHAR(255),
    duree_traitement VARCHAR(50),
    FOREIGN KEY (id_consult) REFERENCES consultations (id_consult) ON DELETE RESTRICT,
    FOREIGN KEY (id_medicament) REFERENCES medicaments (id_medicament) ON DELETE RESTRICT
) ENGINE = InnoDB;
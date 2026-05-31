# VetoApp

VetoApp est une application web de gestion pour une chaîne de **cliniques vétérinaires**. Elle centralise la gestion des comptes, des profils, des animaux, des consultations et des prescriptions.

## Technologies utilisées

- Backend : Python, FastAPI, SQLAlchemy
- Frontend : React, TypeScript, Vite
- Base de données : MySQL
- Scripts SQL : création, données de test, triggers et requêtes

## Structure du projet

- `src/backend/` : code source du serveur FastAPI
- `src/frontend/` : code source de l’interface React
- Racine du projet : scripts SQL (`script_creation.sql`, `seed_data.sql`, `trigger.sql`, `requetes.sql`)

## Ce qu’il faut installer avant de commencer

Si vous partez de zéro, installez d’abord les éléments suivants :

- Python 3.12 ou plus récent
- [Node.js](https://nodejs.org/fr/download) 20 ou plus récent
- MySQL 8 ou MariaDB compatible
- Un éditeur de code comme Visual Studio Code

## Étapes d’installation

### 1. Ouvrir le projet

```bash
cd \ALSI-BDD_PERNON_PRAK_RABAHI_SANTOS
```

### 2. Créer la base de données MySQL

Ouvrez MySQL Workbench, puis créez une base de données vide.

### 3. Importer les scripts SQL

Importez les fichiers SQL dans cet ordre :

1. `script_creation.sql`
2. `trigger.sql`
3. `seed_data.sql`
4. `requetes.sql`

Le fichier `requetes.sql` contient les 15 requêtes SQL du projet.

### 4. Configurer le backend

Le backend lit ses paramètres de connexion dans `src/backend/.env`.

Créez ce fichier avec :

```env
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=11053
DB_NAME=railway
```

Ajoutez ou modifiez ces valeurs à partir de votre installation MySQL.

### 5. Installer et lancer le backend

Ouvrez un terminal dans `src/backend`.

```bash
cd src/backend
python -m venv .venv
```

Activez ensuite l’environnement virtuel sur Windows :

```powershell
.\.venv\Scripts\Activate
```

Installez les dépendances Python :

```bash
pip install -r requirements.txt
```

Lancez le serveur backend :

```bash
fastapi dev
```

Le backend démarre en général sur `http://127.0.0.1:8000`.

### 6. Installer et lancer le frontend

Ouvrez un deuxième terminal dans `src/frontend`.

```bash
cd src/frontend
npm install
npm run dev
```

Le frontend démarre en général sur `http://localhost:5173`.

## Règles métiers

- Un compte utilisateur possède un identifiant unique et un email unique.
- Un compte a un rôle parmi `admin`, `veto` ou `client`.
- Un client possède un profil propriétaire.
- Un vétérinaire possède un profil vétérinaire et peut être rattaché à un établissement.
- Un propriétaire peut avoir plusieurs animaux.
- Un animal appartient à un seul propriétaire.
- Une consultation est liée à un animal et à un vétérinaire.
- Une consultation peut avoir plusieurs prescriptions.
- Une prescription relie une consultation à un médicament.
- Les comptes, les animaux et les établissements peuvent être désactivés via le champ `est_actif`.

## Dictionnaire des données

### `compte_users`

| Champ          | Type        | Description                                |
| -------------- | ----------- | ------------------------------------------ |
| `id_user`      | entier      | Identifiant du compte                      |
| `mail`         | texte       | Adresse email unique                       |
| `mot_de_passe` | texte       | Mot de passe du compte                     |
| `est_actif`    | booléen     | Indique si le compte est actif             |
| `role`         | énumération | Rôle du compte : `admin`, `veto`, `client` |

### `etablissements`

| Champ               | Type    | Description                          |
| ------------------- | ------- | ------------------------------------ |
| `id_etablissement`  | entier  | Identifiant de l’établissement       |
| `nom_etablissement` | texte   | Nom de la clinique ou du cabinet     |
| `ville`             | texte   | Ville de l’établissement             |
| `adresse`           | texte   | Adresse postale                      |
| `est_actif`         | booléen | Indique si l’établissement est actif |

### `proprietaires`

| Champ             | Type   | Description                          |
| ----------------- | ------ | ------------------------------------ |
| `id_proprietaire` | entier | Identifiant du propriétaire          |
| `nom`             | texte  | Nom du propriétaire                  |
| `prenom`          | texte  | Prénom du propriétaire               |
| `telephone`       | texte  | Numéro de téléphone                  |
| `id_user`         | entier | Référence vers le compte utilisateur |

### `animaux`

| Champ             | Type    | Description                      |
| ----------------- | ------- | -------------------------------- |
| `id_animal`       | entier  | Identifiant de l’animal          |
| `nom_animal`      | texte   | Nom de l’animal                  |
| `espece`          | texte   | Espèce de l’animal               |
| `race`            | texte   | Race de l’animal                 |
| `age`             | entier  | Âge de l’animal                  |
| `poids_kg`        | décimal | Poids de l’animal en kilogrammes |
| `est_actif`       | booléen | Indique si l’animal est actif    |
| `id_proprietaire` | entier  | Référence vers le propriétaire   |

### `veterinaires`

| Champ              | Type          | Description                          |
| ------------------ | ------------- | ------------------------------------ |
| `id_veterinaire`   | entier        | Identifiant du vétérinaire           |
| `nom`              | texte         | Nom du vétérinaire                   |
| `prenom`           | texte         | Prénom du vétérinaire                |
| `telephone`        | texte         | Numéro de téléphone                  |
| `id_etablissement` | entier ou nul | Référence vers l’établissement       |
| `id_user`          | entier        | Référence vers le compte utilisateur |

### `medicaments`

| Champ            | Type    | Description               |
| ---------------- | ------- | ------------------------- |
| `id_medicament`  | entier  | Identifiant du médicament |
| `nom_medicament` | texte   | Nom du médicament         |
| `description`    | texte   | Description du médicament |
| `prix_unitaire`  | décimal | Prix unitaire             |

### `consultations`

| Champ            | Type       | Description                      |
| ---------------- | ---------- | -------------------------------- |
| `id_consult`     | entier     | Identifiant de la consultation   |
| `date_consult`   | date/heure | Date et heure de la consultation |
| `diagnostic`     | texte      | Diagnostic posé                  |
| `id_animal`      | entier     | Référence vers l’animal consulté |
| `id_veterinaire` | entier     | Référence vers le vétérinaire    |

### `prescriptions`

| Champ              | Type   | Description                    |
| ------------------ | ------ | ------------------------------ |
| `id_prescription`  | entier | Identifiant de la prescription |
| `id_consult`       | entier | Référence vers la consultation |
| `id_medicament`    | entier | Référence vers le médicament   |
| `posologie`        | texte  | Posologie prescrite            |
| `duree_traitement` | texte  | Durée du traitement            |

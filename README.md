# VetoApp

VetoApp est une application web de gestion pour une clinique vétérinaire. Elle centralise la gestion des comptes, des profils, des animaux, des consultations et des données SQL du projet.

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
- Node.js 20 ou plus récent
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

Le fichier `requetes.sql` contient les requêtes SQL.

### 4. Configurer le backend

Le backend lit ses paramètres de connexion dans `src/backend/.env`.

Créez ce fichier avec :

```env
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
DB_NAME=
```

Ajoutez ces valeurs à partir de votre installation MySQL.

### 5. Installer et lancer le backend

Ouvrez un terminal dans `src/backend`.

```bash
cd src/backend
python -m venv .venv
```

Activez ensuite l’environnement virtuel sur Windows :

```powershell
.\.venv\Scripts\Activate.ps1
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

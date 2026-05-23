import mysql.connector
import os
from dotenv import load_dotenv

# Chargement des variables d'environnement (.env)
load_dotenv()

def get_db_connection():
    """Crée une connexion à la base de données MySQL."""
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "clinique_veto")
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Erreur de connexion : {err}")
        return None
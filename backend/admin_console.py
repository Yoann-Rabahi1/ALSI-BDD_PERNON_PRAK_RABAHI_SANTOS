import os
import mysql.connector
from mysql.connector import Error

from dotenv import load_dotenv
load_dotenv()

db_user = os.getenv("DB_USER", "root")
db_password = os.getenv("DB_PASSWORD", "")
db_host = os.getenv("DB_HOST", "localhost")
db_name = os.getenv("DB_NAME", "railway") 
db_port = os.getenv("DB_PORT", "11053") 

def run_admin_console():
    try:
        # Configuration de la connexion (à adapter avec tes identifiants)
        connection = mysql.connector.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            database=db_name,
            port=db_port
        )

        if connection.is_connected():
            cursor = connection.cursor()
            print("--- VetoApp ADMIN CONSOLE ---")
            print("Tapez 'exit' pour quitter.")

            while True:
                query = input("\nadmin@vetoapp SQL> ")

                if query.lower() in ['exit', 'quit']:
                    break

                if not query.strip():
                    continue

                try:
                    cursor.execute(query)

                    # Si la requête renvoie des données (SELECT)
                    if cursor.description:
                        # Récupération des noms de colonnes
                        columns = [desc[0] for desc in cursor.description]
                        print(" | ".join(columns))
                        print("-" * (len(" | ".join(columns)) + 5))
                        
                        # Affichage des lignes
                        rows = cursor.fetchall()
                        for row in rows:
                            print(" | ".join(str(val) for val in row))
                        
                        print(f"\n({len(rows)} ligne(s) retournée(s))")
                    
                    # Si c'est une modification (INSERT, UPDATE, DELETE)
                    else:
                        connection.commit()
                        print(f"Succès : {cursor.rowcount} ligne(s) affectée(s).")

                except Error as e:
                    print(f"Erreur SQL : {e}")

    except Error as e:
        print(f"Erreur de connexion : {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("\nConnexion fermée.")

if __name__ == "__main__":
    run_admin_console()
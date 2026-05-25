import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

host=os.getenv("DB_HOST", "localhost")
user=os.getenv("DB_USER", "root"),
password=os.getenv("DB_PASSWORD", "")
database=os.getenv("DB_NAME", "clinique_veto")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://root:tmQLJzXIetdYXDhdibFMpPROnJldXqWB@kodama.proxy.rlwy.net:11053/railway"

# Création de l'engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)

# Création de la fabrique de sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# La classe de base pour tes modèles
Base = declarative_base()

# Fonction utilitaire pour récupérer une session de BDD (Dependency Injection)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


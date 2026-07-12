import os
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Load environment variables from .env file at project root
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path)

app_env = os.getenv('APP_ENV', 'production')

if app_env == 'development':
    # Use SQLite in development mode
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'medgraph.db')
    engine = create_engine(f'sqlite:///{db_path}')
    print(f"Using SQLite Database for Development: {db_path}")
else:
    # Use PostgreSQL in production mode
    db_url = os.getenv('DATABASE_URL', 'postgresql+psycopg2://postgres:postgres@localhost:5432/medgraph_db')
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://")
    engine = create_engine(db_url)
    print("Using PostgreSQL Database for Production.")

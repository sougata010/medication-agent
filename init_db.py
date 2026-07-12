import sys
import os

# Ensure the root folder is in path so we can import db
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.db import engine
from db.models import Base

print("Initializing database tables...")
Base.metadata.create_all(engine)
print("Tables created successfully!")

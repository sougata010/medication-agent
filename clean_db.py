import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.join(os.path.dirname(__file__), 'db'))
from models import Base, LabReport, LabParameter, Reminder, AdherenceLog, Prescription, PrescriptionItem, ConversationSession, ConversationMessage

def clean_db():
    engine = create_engine('sqlite:///medgraph.db')
    Session = sessionmaker(bind=engine)
    session = Session()

    print("Cleaning active tracking data...")
    
    session.query(AdherenceLog).delete()
    session.query(Reminder).delete()
    session.query(PrescriptionItem).delete()
    session.query(Prescription).delete()
    session.query(LabParameter).delete()
    session.query(LabReport).delete()
    session.query(ConversationMessage).delete()
    session.query(ConversationSession).delete()

    session.commit()
    print("Database cleaned successfully. Users and Medical Profiles remain.")

if __name__ == "__main__":
    clean_db()

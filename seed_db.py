import os
import sys
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.join(os.path.dirname(__file__), 'db'))
from models import Base, User, LabReport, LabParameter, Reminder, AdherenceLog, Medicine, Prescription, PrescriptionItem

def seed_db():
    engine = create_engine('sqlite:///medgraph.db')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Get the first user
    user = session.query(User).first()
    if not user:
        print("No user found. Please create a user first.")
        return

    print(f"Seeding data for user {user.id} ({user.name})...")

    # Seed Lab Report if none exists
    existing_report = session.query(LabReport).filter_by(user_id=user.id).first()
    if not existing_report:
        report = LabReport(
            user_id=user.id,
            uploaded_at=datetime.datetime.utcnow(),
            ocr_raw="Seeded Lab Report Data"
        )
        session.add(report)
        session.commit()
        
        # Add rich parameters to match LabReports.jsx expectations
        params = [
            LabParameter(report_id=report.id, name='ALT (Alanine Aminotransferase)', value=45, unit='U/L', normal_min=8, normal_max=33, status='High', severity='warning', chemical_type='enzyme', category='Liver Function', confidence=99.4, risk='Elevated ALT suggests mild hepatocellular injury. Common with statin use or fatty liver.', recommendation='Repeat in 3 months. Avoid alcohol. Monitor with AST.'),
            LabParameter(report_id=report.id, name='Hemoglobin A1c', value=5.4, unit='%', normal_min=4.0, normal_max=5.6, status='Normal', severity='normal', chemical_type='protein', category='Metabolic', confidence=98.1, risk='No immediate risk. Blood glucose is well controlled.', recommendation='Continue current lifestyle.'),
            LabParameter(report_id=report.id, name='LDL Cholesterol', value=142, unit='mg/dL', normal_min=0, normal_max=99, status='High', severity='warning', chemical_type='lipid', category='Cardiovascular', confidence=99.0, risk='Increased risk of atherosclerosis and cardiovascular events.', recommendation='Consider statin therapy if other risk factors are present. Diet modification.'),
            LabParameter(report_id=report.id, name='Creatinine', value=0.9, unit='mg/dL', normal_min=0.74, normal_max=1.35, status='Normal', severity='normal', chemical_type='metabolite', category='Kidney Function', confidence=99.9, risk='Renal function appears normal.', recommendation='Ensure adequate hydration.')
        ]
        session.add_all(params)
        session.commit()
        print("Lab Report seeded.")
    else:
        print("Lab Report already exists.")

    # Seed Prescription and Medicine
    medicine = session.query(Medicine).filter_by(name='Atorvastatin').first()
    if not medicine:
        medicine = Medicine(name='Atorvastatin', generic_name='Atorvastatin', category='Statin', mechanism='HMG-CoA reductase inhibitor')
        session.add(medicine)
        session.commit()

    prescription = session.query(Prescription).filter_by(user_id=user.id).first()
    if not prescription:
        prescription = Prescription(user_id=user.id, uploaded_at=datetime.datetime.utcnow(), ocr_raw='Rx Atorvastatin 20mg', verified=True)
        session.add(prescription)
        session.commit()
        
        item = PrescriptionItem(prescription_id=prescription.id, medicine_id=medicine.id, dosage='20mg', frequency='Daily', duration='30 days', timing='["evening"]')
        session.add(item)
        session.commit()
        
        # Add a reminder
        reminder = Reminder(user_id=user.id, medicine_id=medicine.id, scheduled_at=datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'), channel='Email', status='pending')
        session.add(reminder)
        session.commit()

    reminders = session.query(Reminder).filter_by(user_id=user.id).limit(3).all()
    if reminders:
        print("Seeding adherence logs...")
        now = datetime.datetime.utcnow()
        for i in range(7):
            for reminder in reminders:
                import random
                action = 'taken' if random.random() > 0.2 else 'missed'
                log_time = now - datetime.timedelta(days=i, hours=random.randint(1, 10))
                
                existing = session.query(AdherenceLog).filter_by(reminder_id=reminder.id).filter(AdherenceLog.logged_at >= log_time.replace(hour=0, minute=0, second=0)).first()
                if not existing:
                    log = AdherenceLog(reminder_id=reminder.id, action=action, reason="Seeded data", logged_at=log_time)
                    session.add(log)
        session.commit()
        print("Adherence logs seeded.")

    print("Seeding complete.")

if __name__ == "__main__":
    seed_db()

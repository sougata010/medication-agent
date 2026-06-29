import datetime
from typing import List, Optional
from sqlalchemy import (
    create_engine, Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(50), nullable=True)
    language = Column(String(50), default='en')
    reminder_channel = Column(String(50), default='Email') # Email, Telegram, Discord, Calendar, Push
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    medical_profile = relationship("MedicalProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="user", cascade="all, delete-orphan")
    lab_reports = relationship("LabReport", back_populates="user", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")
    conversation_sessions = relationship("ConversationSession", back_populates="user", cascade="all, delete-orphan")

class MedicalProfile(Base):
    __tablename__ = 'medical_profiles'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    allergies = Column(JSON, default=list) # List of strings e.g. ["NSAIDs", "Penicillin"]
    conditions = Column(JSON, default=list) # List of chronic conditions e.g. ["Hypertension", "Diabetes"]
    pregnancy_status = Column(Boolean, default=False)
    emergency_contacts = Column(JSON, default=dict) # e.g. {"name": "John Doe", "phone": "1234567890", "relation": "Spouse"}
    
    user = relationship("User", back_populates="medical_profile")

class Prescription(Base):
    __tablename__ = 'prescriptions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    ocr_raw = Column(Text, nullable=True)
    verified = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="prescriptions")
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")

class Medicine(Base):
    __tablename__ = 'medicines'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), unique=True, nullable=False)
    generic_name = Column(String(200), nullable=True)
    chemical_name = Column(String(200), nullable=True)
    category = Column(String(100), nullable=True)
    mechanism = Column(Text, nullable=True)
    
    prescription_items = relationship("PrescriptionItem", back_populates="medicine")
    reminders = relationship("Reminder", back_populates="medicine")

class PrescriptionItem(Base):
    __tablename__ = 'prescription_items'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    prescription_id = Column(Integer, ForeignKey('prescriptions.id', ondelete='CASCADE'), nullable=False)
    medicine_id = Column(Integer, ForeignKey('medicines.id', ondelete='CASCADE'), nullable=False)
    dosage = Column(String(100), nullable=False) # e.g. "500 mg"
    frequency = Column(String(100), nullable=False) # e.g. "Twice daily" or "1-0-1"
    duration = Column(String(100), nullable=True) # e.g. "7 days"
    timing = Column(JSON, default=list) # e.g. ["morning", "night"]
    
    prescription = relationship("Prescription", back_populates="items")
    medicine = relationship("Medicine", back_populates="prescription_items")

class LabReport(Base):
    __tablename__ = 'lab_reports'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    ocr_raw = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="lab_reports")
    parameters = relationship("LabParameter", back_populates="lab_report", cascade="all, delete-orphan")

class LabParameter(Base):
    __tablename__ = 'lab_parameters'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey('lab_reports.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(150), nullable=False) # e.g. "Creatinine" or "HbA1c"
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False) # e.g. "mg/dL"
    si_value = Column(Float, nullable=True)
    reference_range = Column(String(100), nullable=True) # e.g. "0.7 - 1.3"
    
    lab_report = relationship("LabReport", back_populates="parameters")

class Reminder(Base):
    __tablename__ = 'reminders'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    medicine_id = Column(Integer, ForeignKey('medicines.id', ondelete='CASCADE'), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    channel = Column(String(50), nullable=False) # Email, Telegram, Discord, Calendar, Push
    status = Column(String(50), default='pending') # pending, sent, taken, skipped, missed
    
    user = relationship("User", back_populates="reminders")
    medicine = relationship("Medicine", back_populates="reminders")
    adherence_logs = relationship("AdherenceLog", back_populates="reminder", cascade="all, delete-orphan")

class AdherenceLog(Base):
    __tablename__ = 'adherence_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    reminder_id = Column(Integer, ForeignKey('reminders.id', ondelete='CASCADE'), nullable=False)
    action = Column(String(50), nullable=False) # taken, skipped, missed
    reason = Column(String(255), nullable=True)
    logged_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    reminder = relationship("Reminder", back_populates="adherence_logs")

class ConversationSession(Base):
    __tablename__ = 'conversation_sessions'
    
    id = Column(String(100), primary_key=True) # session_id (e.g. UUID)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    summary = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="conversation_sessions")
    messages = relationship("ConversationMessage", back_populates="session", cascade="all, delete-orphan")

class ConversationMessage(Base):
    __tablename__ = 'conversation_messages'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(100), ForeignKey('conversation_sessions.id', ondelete='CASCADE'), nullable=False)
    role = Column(String(50), nullable=False) # user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("ConversationSession", back_populates="messages")

class VectorEmbedding(Base):
    __tablename__ = 'vector_embeddings'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_type = Column(String(50), nullable=False) # QA, Prescription, LabReport, Guideline
    entity_id = Column(String(100), nullable=False)
    embedding = Column(JSON, nullable=False) # Store float list as JSON to support SQLite & Postgres out-of-the-box
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

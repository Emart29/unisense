"""Database models and connection management"""
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from config import get_settings

settings = get_settings()

# Create database engine
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class WhatsAppMessage(Base):
    """WhatsApp message model"""
    __tablename__ = "whatsapp_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    university_id = Column(UUID(as_uuid=True), nullable=False)
    phone_number = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

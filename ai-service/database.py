"""Database connection module for AI service (read-only)"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from contextlib import contextmanager
import os
from typing import Generator

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://unisense_user:unisense_password@localhost:5432/unisense")

# Create read-only engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

@contextmanager
def get_db() -> Generator[Session, None, None]:
    """Get database session context manager"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_session() -> Session:
    """Get database session for dependency injection"""
    return SessionLocal()

"""Configuration management for WhatsApp service"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # WhatsApp API Configuration
    whatsapp_api_url: str = "https://graph.facebook.com/v18.0"
    whatsapp_api_token: str = "test_token"
    webhook_secret: str = "test_secret"
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379"
    
    # Database Configuration
    database_url: str = "sqlite:///./test.db"
    
    # Service Configuration
    max_retries: int = 3
    retry_delays: list[int] = [1, 2, 4]  # Exponential backoff in seconds
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

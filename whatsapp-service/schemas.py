"""Pydantic schemas for request/response validation"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class SendMessageRequest(BaseModel):
    """Request schema for sending a message"""
    university_id: str = Field(..., description="University ID for multi-tenancy")
    phone_number: str = Field(..., description="Recipient phone number in E.164 format")
    message: str = Field(..., description="Message content to send")


class SendTemplateRequest(BaseModel):
    """Request schema for sending a templated message"""
    university_id: str = Field(..., description="University ID for multi-tenancy")
    phone_number: str = Field(..., description="Recipient phone number in E.164 format")
    template_name: str = Field(..., description="WhatsApp template name")
    template_params: Optional[dict] = Field(default={}, description="Template parameters")


class WebhookRequest(BaseModel):
    """Request schema for webhook"""
    message_id: str = Field(..., description="Message ID")
    status: str = Field(..., description="Delivery status")
    timestamp: Optional[datetime] = None


class MessageResponse(BaseModel):
    """Response schema for message operations"""
    message_id: str
    status: str
    message: str = "Message queued for delivery"


class HealthResponse(BaseModel):
    """Response schema for health check"""
    status: str
    service: str
    redis_connected: bool
    database_connected: bool

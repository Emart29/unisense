"""WhatsApp Service - FastAPI microservice for async WhatsApp messaging"""
import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import Optional
import uuid

from fastapi import FastAPI, HTTPException, Header, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import redis.asyncio as redis

from config import get_settings
from database import get_db, WhatsAppMessage, engine, Base
from schemas import (
    SendMessageRequest,
    SendTemplateRequest,
    WebhookRequest,
    MessageResponse,
    HealthResponse
)
from whatsapp_client import WhatsAppClient
from queue_consumer import consumer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

# Redis client for queue
redis_client: Optional[redis.Redis] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown"""
    global redis_client
    
    # Startup
    logger.info("Starting WhatsApp Service...")
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # Connect to Redis
    redis_client = await redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True
    )
    
    # Start message queue consumer in background
    consumer_task = asyncio.create_task(consumer.start())
    
    logger.info("WhatsApp Service started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down WhatsApp Service...")
    await consumer.stop()
    consumer_task.cancel()
    
    if redis_client:
        await redis_client.close()
    
    logger.info("WhatsApp Service shut down successfully")


app = FastAPI(
    title="UniSense WhatsApp Service",
    description="Asynchronous WhatsApp message delivery service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint
    
    Checks connectivity to Redis and database
    """
    redis_connected = False
    database_connected = False
    
    # Check Redis connection
    try:
        if redis_client:
            await redis_client.ping()
            redis_connected = True
    except Exception as e:
        logger.error(f"Redis health check failed: {str(e)}")
    
    # Check database connection
    try:
        db.execute("SELECT 1")
        database_connected = True
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
    
    status = "healthy" if (redis_connected and database_connected) else "unhealthy"
    
    return HealthResponse(
        status=status,
        service="whatsapp-service",
        redis_connected=redis_connected,
        database_connected=database_connected
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "UniSense WhatsApp Service",
        "version": "1.0.0",
        "status": "running"
    }


@app.post("/send-message", response_model=MessageResponse)
async def send_message(
    request: SendMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Send a WhatsApp message asynchronously
    
    The message is queued for async processing and will be retried
    up to 3 times with exponential backoff if delivery fails.
    
    Args:
        request: Message request with university_id, phone_number, and message
        db: Database session
        
    Returns:
        Message response with message_id and status
    """
    try:
        # Create message record in database
        message_id = uuid.uuid4()
        db_message = WhatsAppMessage(
            id=message_id,
            university_id=uuid.UUID(request.university_id),
            phone_number=request.phone_number,
            message=request.message,
            status="pending",
            retry_count=0
        )
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        
        # Queue message for async processing
        message_data = {
            "message_id": str(message_id),
            "phone_number": request.phone_number,
            "message": request.message
        }
        
        if redis_client:
            await redis_client.rpush(
                "whatsapp:messages",
                json.dumps(message_data)
            )
        else:
            raise HTTPException(status_code=503, detail="Message queue unavailable")
        
        logger.info(f"Message {message_id} queued for delivery")
        
        return MessageResponse(
            message_id=str(message_id),
            status="pending",
            message="Message queued for delivery"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Failed to queue message: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to queue message: {str(e)}")


@app.post("/send-template", response_model=MessageResponse)
async def send_template(
    request: SendTemplateRequest,
    db: Session = Depends(get_db)
):
    """
    Send a templated WhatsApp message asynchronously
    
    Args:
        request: Template request with university_id, phone_number, template_name, and params
        db: Database session
        
    Returns:
        Message response with message_id and status
    """
    try:
        # Create message record in database
        message_id = uuid.uuid4()
        
        # Format template message for storage
        template_message = f"Template: {request.template_name}"
        if request.template_params:
            template_message += f" | Params: {json.dumps(request.template_params)}"
        
        db_message = WhatsAppMessage(
            id=message_id,
            university_id=uuid.UUID(request.university_id),
            phone_number=request.phone_number,
            message=template_message,
            status="pending",
            retry_count=0
        )
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        
        # Send template message directly (templates are typically time-sensitive)
        whatsapp_client = WhatsAppClient()
        try:
            await whatsapp_client.send_template(
                request.phone_number,
                request.template_name,
                request.template_params
            )
            
            db_message.status = "sent"
            db.commit()
            
            logger.info(f"Template message {message_id} sent successfully")
            
            return MessageResponse(
                message_id=str(message_id),
                status="sent",
                message="Template message sent successfully"
            )
            
        except Exception as e:
            logger.error(f"Failed to send template message: {str(e)}")
            db_message.status = "failed"
            db.commit()
            raise HTTPException(status_code=500, detail=f"Failed to send template: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process template request: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process template: {str(e)}")


@app.post("/webhook")
async def webhook(
    request: WebhookRequest,
    x_webhook_token: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Webhook endpoint for receiving delivery status updates
    
    Validates webhook token before processing updates.
    
    Args:
        request: Webhook request with message_id and status
        x_webhook_token: Webhook validation token from header
        db: Database session
        
    Returns:
        Success confirmation
    """
    # Validate webhook token
    if x_webhook_token != settings.webhook_secret:
        logger.warning("Webhook request with invalid token")
        raise HTTPException(status_code=401, detail="Invalid webhook token")
    
    try:
        # Update message status in database
        db_message = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.id == uuid.UUID(request.message_id)
        ).first()
        
        if not db_message:
            logger.warning(f"Webhook for unknown message: {request.message_id}")
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Update status
        db_message.status = request.status
        db_message.updated_at = request.timestamp if request.timestamp else db_message.updated_at
        db.commit()
        
        logger.info(f"Message {request.message_id} status updated to {request.status}")
        
        return {"status": "success", "message": "Webhook processed"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process webhook: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process webhook: {str(e)}")

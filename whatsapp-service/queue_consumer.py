"""Message queue consumer with retry logic"""
import asyncio
import json
import redis.asyncio as redis
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import logging

from config import get_settings
from database import SessionLocal, WhatsAppMessage
from whatsapp_client import WhatsAppClient

settings = get_settings()
logger = logging.getLogger(__name__)


class MessageQueueConsumer:
    """Consumer for processing WhatsApp messages from Redis queue"""
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.whatsapp_client = WhatsAppClient()
        self.queue_name = "whatsapp:messages"
        self.running = False
    
    async def connect(self):
        """Connect to Redis"""
        self.redis_client = await redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True
        )
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
    
    async def process_message(self, message_data: dict, db: Session) -> bool:
        """
        Process a single message with retry logic
        
        Args:
            message_data: Message data from queue
            db: Database session
            
        Returns:
            True if message was sent successfully, False otherwise
        """
        message_id = message_data.get("message_id")
        phone_number = message_data.get("phone_number")
        message_text = message_data.get("message")
        
        # Convert string UUID to UUID object if needed
        if isinstance(message_id, str):
            import uuid as uuid_module
            message_id = uuid_module.UUID(message_id)
        
        # Get message from database
        db_message = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.id == message_id
        ).first()
        
        if not db_message:
            logger.error(f"Message {message_id} not found in database")
            return False
        
        # Check if max retries exceeded
        if db_message.retry_count >= settings.max_retries:
            db_message.status = "failed"
            db_message.updated_at = datetime.utcnow()
            db.commit()
            logger.error(f"Message {message_id} failed after {settings.max_retries} retries")
            return False
        
        try:
            # Attempt to send message
            result = await self.whatsapp_client.send_message(phone_number, message_text)
            
            # Update status to sent
            db_message.status = "sent"
            db_message.updated_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Message {message_id} sent successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send message {message_id}: {str(e)}")
            
            # Increment retry count
            db_message.retry_count += 1
            db_message.updated_at = datetime.utcnow()
            
            # If max retries not exceeded, requeue with exponential backoff
            if db_message.retry_count < settings.max_retries:
                db.commit()
                
                # Calculate delay based on retry count
                delay = settings.retry_delays[min(db_message.retry_count - 1, len(settings.retry_delays) - 1)]
                
                # Requeue message after delay
                await asyncio.sleep(delay)
                await self.enqueue_message(message_data)
                
                logger.info(f"Message {message_id} requeued (retry {db_message.retry_count}/{settings.max_retries})")
            else:
                # Mark as failed
                db_message.status = "failed"
                db.commit()
                logger.error(f"Message {message_id} permanently failed")
            
            return False
    
    async def enqueue_message(self, message_data: dict):
        """Add message to queue"""
        if self.redis_client:
            await self.redis_client.rpush(
                self.queue_name,
                json.dumps(message_data)
            )
    
    async def start(self):
        """Start consuming messages from queue"""
        self.running = True
        await self.connect()
        
        logger.info("Message queue consumer started")
        
        while self.running:
            try:
                # Block and wait for message (with timeout)
                result = await self.redis_client.blpop(self.queue_name, timeout=5)
                
                if result:
                    _, message_json = result
                    message_data = json.loads(message_json)
                    
                    # Process message with database session
                    db = SessionLocal()
                    try:
                        await self.process_message(message_data, db)
                    finally:
                        db.close()
                        
            except Exception as e:
                logger.error(f"Error in message consumer: {str(e)}")
                await asyncio.sleep(1)
        
        await self.disconnect()
        logger.info("Message queue consumer stopped")
    
    async def stop(self):
        """Stop consuming messages"""
        self.running = False


# Global consumer instance
consumer = MessageQueueConsumer()

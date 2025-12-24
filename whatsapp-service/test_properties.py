"""
Property-based tests for WhatsApp Service

These tests validate correctness properties using Hypothesis for property-based testing.
Each test runs 100+ iterations with randomly generated inputs.
"""
import pytest
import asyncio
import uuid
import json
from datetime import datetime
from hypothesis import given, strategies as st, settings, HealthCheck
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import AsyncMock, patch, MagicMock

from main import app
from database import Base, WhatsAppMessage
from config import get_settings

# Test database setup
TEST_DATABASE_URL = "sqlite:///./test.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Create test tables
Base.metadata.create_all(bind=test_engine)


# Hypothesis strategies for generating test data
@st.composite
def university_id_strategy(draw):
    """Generate valid UUID for university_id"""
    return str(uuid.uuid4())


@st.composite
def phone_number_strategy(draw):
    """Generate valid phone numbers in E.164 format"""
    country_code = draw(st.integers(min_value=1, max_value=999))
    number = draw(st.integers(min_value=1000000, max_value=9999999999))
    return f"+{country_code}{number}"


@st.composite
def message_strategy(draw):
    """Generate valid message content"""
    return draw(st.text(min_size=1, max_size=1000))


@st.composite
def send_message_request_strategy(draw):
    """Generate valid SendMessageRequest data"""
    return {
        "university_id": draw(university_id_strategy()),
        "phone_number": draw(phone_number_strategy()),
        "message": draw(message_strategy())
    }


# Override database dependency for testing
def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def test_db():
    """Create a fresh database for each test"""
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
async def mock_redis():
    """Mock Redis client"""
    redis_mock = AsyncMock()
    redis_mock.rpush = AsyncMock(return_value=1)
    redis_mock.ping = AsyncMock(return_value=True)
    return redis_mock


@pytest.fixture
async def client(mock_redis):
    """Create test client with mocked dependencies"""
    from database import get_db
    from httpx import ASGITransport
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Mock Redis client
    with patch('main.redis_client', mock_redis):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
    
    app.dependency_overrides.clear()


# Property 23: WhatsApp async dispatch
# Feature: unisense-mvp, Property 23: WhatsApp async dispatch
# Validates: Requirements 6.3, 12.1
@pytest.mark.asyncio
@settings(
    max_examples=100, 
    suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow],
    deadline=None
)
@given(request_data=send_message_request_strategy())
async def test_property_23_whatsapp_async_dispatch(request_data, test_db):
    """
    Property 23: WhatsApp async dispatch
    
    For any WhatsApp notification triggered, the Core Backend should dispatch 
    the message asynchronously to the WhatsApp Service without blocking, 
    returning immediately.
    
    Validates: Requirements 6.3, 12.1
    """
    from database import get_db
    from httpx import ASGITransport
    
    # Create fresh mock for each test run
    mock_redis = AsyncMock()
    mock_redis.rpush = AsyncMock(return_value=1)
    mock_redis.ping = AsyncMock(return_value=True)
    
    app.dependency_overrides[get_db] = override_get_db
    
    with patch('main.redis_client', mock_redis):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Send message request
            response = await client.post("/send-message", json=request_data)
            
            # Property: Request should return immediately with pending status
            assert response.status_code == 200
            response_data = response.json()
            
            # Verify async dispatch behavior
            assert response_data["status"] == "pending"
            assert "message_id" in response_data
            assert response_data["message"] == "Message queued for delivery"
            
            # Verify message was queued (not sent synchronously)
            assert mock_redis.rpush.call_count == 1
            call_args = mock_redis.rpush.call_args
            assert call_args[0][0] == "whatsapp:messages"
            
            # Verify message was stored in database with pending status
            message_id = uuid.UUID(response_data["message_id"])
            db_message = test_db.query(WhatsAppMessage).filter(
                WhatsAppMessage.id == message_id
            ).first()
            
            assert db_message is not None
            assert db_message.status == "pending"
            assert db_message.phone_number == request_data["phone_number"]
            assert db_message.message == request_data["message"]
            assert db_message.retry_count == 0
    
    app.dependency_overrides.clear()


# Property 24: WhatsApp message processing
# Feature: unisense-mvp, Property 24: WhatsApp message processing
# Validates: Requirements 6.4
@pytest.mark.asyncio
@settings(
    max_examples=100, 
    suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow],
    deadline=None
)
@given(request_data=send_message_request_strategy())
async def test_property_24_whatsapp_message_processing(request_data, test_db):
    """
    Property 24: WhatsApp message processing
    
    For any message received by the WhatsApp Service, the service should send it 
    via WhatsApp Business API and log the delivery status.
    
    Validates: Requirements 6.4
    """
    from queue_consumer import MessageQueueConsumer
    from whatsapp_client import WhatsAppClient
    
    # Create message in database
    message_id = uuid.uuid4()
    db_message = WhatsAppMessage(
        id=message_id,
        university_id=uuid.UUID(request_data["university_id"]),
        phone_number=request_data["phone_number"],
        message=request_data["message"],
        status="pending",
        retry_count=0
    )
    test_db.add(db_message)
    test_db.commit()
    test_db.refresh(db_message)
    
    # Mock WhatsApp API client
    mock_whatsapp_client = AsyncMock(spec=WhatsAppClient)
    mock_whatsapp_client.send_message = AsyncMock(return_value={"message_id": str(message_id)})
    
    # Create consumer and process message
    consumer = MessageQueueConsumer()
    consumer.whatsapp_client = mock_whatsapp_client
    
    message_data = {
        "message_id": str(message_id),
        "phone_number": request_data["phone_number"],
        "message": request_data["message"]
    }
    
    # Process the message
    result = await consumer.process_message(message_data, test_db)
    
    # Property: Message should be sent via WhatsApp API
    assert result is True
    mock_whatsapp_client.send_message.assert_called_once_with(
        request_data["phone_number"],
        request_data["message"]
    )
    
    # Property: Delivery status should be logged in database
    test_db.refresh(db_message)
    assert db_message.status == "sent"
    assert db_message.updated_at is not None


# Property 25: WhatsApp retry logic
# Feature: unisense-mvp, Property 25: WhatsApp retry logic
# Validates: Requirements 6.5
@pytest.mark.asyncio
@settings(
    max_examples=100, 
    suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow],
    deadline=None
)
@given(
    request_data=send_message_request_strategy(),
    failure_count=st.integers(min_value=1, max_value=5)
)
async def test_property_25_whatsapp_retry_logic(request_data, failure_count, test_db):
    """
    Property 25: WhatsApp retry logic
    
    For any failed WhatsApp message, the service should retry delivery up to 
    three times before marking as permanently failed.
    
    Validates: Requirements 6.5
    """
    from queue_consumer import MessageQueueConsumer
    from whatsapp_client import WhatsAppClient
    from config import get_settings
    
    settings = get_settings()
    max_retries = settings.max_retries
    
    # Create message in database
    message_id = uuid.uuid4()
    db_message = WhatsAppMessage(
        id=message_id,
        university_id=uuid.UUID(request_data["university_id"]),
        phone_number=request_data["phone_number"],
        message=request_data["message"],
        status="pending",
        retry_count=0
    )
    test_db.add(db_message)
    test_db.commit()
    
    # Mock WhatsApp API client to fail
    mock_whatsapp_client = AsyncMock(spec=WhatsAppClient)
    mock_whatsapp_client.send_message = AsyncMock(side_effect=Exception("API Error"))
    
    # Mock Redis for requeuing
    mock_redis = AsyncMock()
    mock_redis.rpush = AsyncMock(return_value=1)
    
    # Create consumer
    consumer = MessageQueueConsumer()
    consumer.whatsapp_client = mock_whatsapp_client
    consumer.redis_client = mock_redis
    
    message_data = {
        "message_id": str(message_id),
        "phone_number": request_data["phone_number"],
        "message": request_data["message"]
    }
    
    # Simulate retries
    for attempt in range(min(failure_count, max_retries)):
        result = await consumer.process_message(message_data, test_db)
        test_db.refresh(db_message)
        
        if attempt < max_retries - 1:
            # Property: Should retry if under max retries
            assert result is False
            assert db_message.retry_count == attempt + 1
            assert db_message.status == "pending"
            
            # Verify message was requeued
            if failure_count > attempt + 1:
                mock_redis.rpush.assert_called()
        else:
            # Property: Should mark as failed after max retries
            assert result is False
            assert db_message.retry_count == max_retries
            assert db_message.status == "failed"


# Property 37: Webhook security
# Feature: unisense-mvp, Property 37: Webhook security
# Validates: Requirements 12.2
@pytest.mark.asyncio
@settings(
    max_examples=100, 
    suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow],
    deadline=None
)
@given(
    message_id=st.uuids(),
    status=st.sampled_from(["sent", "delivered", "failed"]),
    valid_token=st.booleans()
)
async def test_property_37_webhook_security(message_id, status, valid_token, test_db):
    """
    Property 37: Webhook security
    
    For any webhook request to the WhatsApp Service, requests with invalid tokens 
    should be rejected, and only requests with valid tokens should be processed.
    
    Validates: Requirements 12.2
    """
    from database import get_db
    from config import get_settings
    from httpx import ASGITransport
    
    settings = get_settings()
    app.dependency_overrides[get_db] = override_get_db
    
    # Create fresh mock for each test run
    mock_redis = AsyncMock()
    mock_redis.ping = AsyncMock(return_value=True)
    
    # Check if message already exists and skip if so (for hypothesis retries)
    existing = test_db.query(WhatsAppMessage).filter(
        WhatsAppMessage.id == message_id
    ).first()
    
    if existing:
        test_db.rollback()
        # Use existing message
        db_message = existing
    else:
        # Create a message in database
        db_message = WhatsAppMessage(
            id=message_id,
            university_id=uuid.uuid4(),
            phone_number="+1234567890",
            message="Test message",
            status="sent",
            retry_count=0
        )
        test_db.add(db_message)
        try:
            test_db.commit()
        except Exception:
            test_db.rollback()
            # Try to get existing message
            db_message = test_db.query(WhatsAppMessage).filter(
                WhatsAppMessage.id == message_id
            ).first()
            if not db_message:
                raise
    
    webhook_data = {
        "message_id": str(message_id),
        "status": status,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Set token based on test parameter
    token = settings.webhook_secret if valid_token else "invalid_token"
    headers = {"x-webhook-token": token}
    
    with patch('main.redis_client', mock_redis):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/webhook", json=webhook_data, headers=headers)
            
            if valid_token:
                # Property: Valid token should allow webhook processing
                assert response.status_code == 200
                
                # Verify status was updated
                test_db.refresh(db_message)
                assert db_message.status == status
            else:
                # Property: Invalid token should reject webhook
                assert response.status_code == 401
                
                # Verify status was NOT updated
                test_db.refresh(db_message)
                assert db_message.status == "sent"  # Original status unchanged
    
    app.dependency_overrides.clear()


# Property 36: WhatsApp service independence
# Feature: unisense-mvp, Property 36: WhatsApp service independence
# Validates: Requirements 12.4
@pytest.mark.asyncio
@settings(
    max_examples=100, 
    suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow],
    deadline=None
)
@given(request_data=send_message_request_strategy())
async def test_property_36_whatsapp_service_independence(request_data, test_db):
    """
    Property 36: WhatsApp service independence
    
    For any state of the WhatsApp Service (available or unavailable), the Core 
    Backend should continue processing all other operations without interruption.
    
    Validates: Requirements 12.4
    """
    from database import get_db
    from httpx import ASGITransport
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Simulate WhatsApp service unavailable (Redis unavailable)
    with patch('main.redis_client', None):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Attempt to send message
            response = await client.post("/send-message", json=request_data)
            
            # Property: Service should return error but not crash
            assert response.status_code == 503
            assert "unavailable" in response.json()["detail"].lower()
    
    # Simulate WhatsApp service available
    mock_redis = AsyncMock()
    mock_redis.rpush = AsyncMock(return_value=1)
    mock_redis.ping = AsyncMock(return_value=True)
    
    with patch('main.redis_client', mock_redis):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Health check should work independently
            health_response = await client.get("/health")
            
            # Property: Other operations continue regardless of WhatsApp service state
            assert health_response.status_code == 200
            health_data = health_response.json()
            assert "status" in health_data
            assert health_data["service"] == "whatsapp-service"
    
    app.dependency_overrides.clear()

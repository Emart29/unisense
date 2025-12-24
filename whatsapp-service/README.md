# WhatsApp Service

FastAPI microservice for asynchronous WhatsApp message delivery with retry logic and webhook support.

## Features

- **Async Message Processing**: Messages are queued in Redis and processed asynchronously
- **Retry Logic**: Failed messages are retried up to 3 times with exponential backoff (1s, 2s, 4s)
- **Webhook Support**: Receives delivery status updates from WhatsApp Business API
- **Message Logging**: All messages and their statuses are logged in the database
- **Health Checks**: Monitors Redis and database connectivity

## Architecture

The service consists of:
- **FastAPI Application**: REST API endpoints for sending messages and receiving webhooks
- **Message Queue Consumer**: Background worker that processes messages from Redis queue
- **WhatsApp Client**: Integration with WhatsApp Business API
- **Database**: PostgreSQL for message logging (SQLite for testing)

## API Endpoints

### POST /send-message
Send a WhatsApp message asynchronously.

**Request Body:**
```json
{
  "university_id": "uuid",
  "phone_number": "+1234567890",
  "message": "Your message here"
}
```

**Response:**
```json
{
  "message_id": "uuid",
  "status": "pending",
  "message": "Message queued for delivery"
}
```

### POST /send-template
Send a templated WhatsApp message.

**Request Body:**
```json
{
  "university_id": "uuid",
  "phone_number": "+1234567890",
  "template_name": "welcome_message",
  "template_params": {
    "name": "John Doe"
  }
}
```

### POST /webhook
Receive delivery status updates from WhatsApp Business API.

**Headers:**
- `x-webhook-token`: Webhook validation token

**Request Body:**
```json
{
  "message_id": "uuid",
  "status": "delivered",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "whatsapp-service",
  "redis_connected": true,
  "database_connected": true
}
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# WhatsApp API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_TOKEN=your-whatsapp-api-token
WEBHOOK_SECRET=your-webhook-secret

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/unisense
```

## Installation

### Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn main:app --reload --port 8002
```

### Production

```bash
# Install production dependencies (includes PostgreSQL driver)
pip install -r requirements-prod.txt

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8002
```

### Docker

```bash
# Build image
docker build -t whatsapp-service .

# Run container
docker run -p 8002:8002 --env-file .env whatsapp-service
```

## Testing

### Run Property-Based Tests

```bash
# Run all tests
pytest test_properties.py -v

# Run specific test
pytest test_properties.py::test_property_23_whatsapp_async_dispatch -v

# Run with coverage
pytest test_properties.py --cov=. --cov-report=html
```

### Property Tests

The service includes 5 property-based tests that validate correctness properties:

1. **Property 23**: WhatsApp async dispatch - Messages are queued asynchronously without blocking
2. **Property 24**: WhatsApp message processing - Messages are sent via API and status is logged
3. **Property 25**: WhatsApp retry logic - Failed messages are retried up to 3 times
4. **Property 37**: Webhook security - Invalid tokens are rejected
5. **Property 36**: WhatsApp service independence - Service failures don't block other operations

Each test runs 100+ iterations with randomly generated inputs using Hypothesis.

## Message Flow

1. **Core Backend** sends message request to `/send-message`
2. **WhatsApp Service** creates database record with status "pending"
3. Message is added to **Redis queue**
4. **Queue Consumer** picks up message from queue
5. Consumer sends message via **WhatsApp Business API**
6. Status is updated to "sent" in database
7. **WhatsApp** sends delivery status to `/webhook`
8. Status is updated to "delivered" or "failed"

## Retry Logic

If message delivery fails:
- Retry 1: Wait 1 second, retry
- Retry 2: Wait 2 seconds, retry
- Retry 3: Wait 4 seconds, retry
- After 3 failures: Mark as "failed"

## Database Schema

```sql
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY,
  university_id UUID NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,  -- pending, sent, delivered, failed
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Integration with Core Backend

The Core Backend should:

1. Send messages to `/send-message` endpoint
2. Handle 503 errors gracefully (service unavailable)
3. Configure webhook URL in WhatsApp Business API settings
4. Set `WEBHOOK_SECRET` to match the secret in WhatsApp Business API

## Monitoring

Monitor these metrics:
- Message queue depth (Redis)
- Message delivery success rate
- Average retry count
- Webhook processing time
- Database connection health

## Troubleshooting

### Messages stuck in "pending" status
- Check if queue consumer is running
- Verify Redis connection
- Check WhatsApp API credentials

### Webhook not working
- Verify `WEBHOOK_SECRET` matches WhatsApp Business API settings
- Check webhook URL is publicly accessible
- Review webhook logs for errors

### High retry count
- Check WhatsApp API rate limits
- Verify phone numbers are in E.164 format
- Review WhatsApp API error messages

# WhatsApp Service Integration Guide

## Overview

The WhatsApp Service is a standalone FastAPI microservice that handles asynchronous WhatsApp message delivery for the UniSense platform. It uses the WhatsApp Business API and implements retry logic, message queuing, and delivery status tracking.

## Architecture

```
Core Backend → Redis Queue → WhatsApp Service → WhatsApp Business API
                                    ↓
                              Database (Logging)
```

### Key Features

- **Asynchronous Processing** - Messages are queued and processed without blocking
- **Retry Logic** - Failed messages are retried up to 3 times with exponential backoff
- **Status Tracking** - All messages are logged with delivery status
- **Webhook Support** - Receives delivery status updates from WhatsApp
- **Circuit Breaker** - Prevents cascading failures

## Base URL

```
http://localhost:8002
```

## Prerequisites

1. **WhatsApp Business API Account**
   - Sign up at https://business.whatsapp.com
   - Get API credentials (Phone Number ID, Access Token)
   - Configure webhook URL

2. **Redis Server**
   - For message queue
   - Connection string: `redis://localhost:6379`

3. **PostgreSQL Database**
   - For message logging
   - Shared with Core Backend

## Environment Variables

```bash
# WhatsApp API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_TOKEN=your_access_token

# Webhook Configuration
WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/unisense

# Service Configuration
PORT=8002
LOG_LEVEL=INFO
MAX_RETRIES=3
RETRY_DELAY=1  # seconds
```

## API Endpoints

### POST /send-message

Send a WhatsApp message to a single recipient.

**Request Body:**
```json
{
  "phone": "+2348012345678",
  "message": "Hello! Your exam results have been published.",
  "universityId": "uuid"
}
```

**Response:**
```json
{
  "messageId": "uuid",
  "status": "queued",
  "queuedAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `202` - Message queued successfully
- `400` - Invalid phone number or message
- `500` - Service error

### POST /send-template

Send a templated WhatsApp message.

**Request Body:**
```json
{
  "phone": "+2348012345678",
  "templateName": "grade_notification",
  "templateParams": {
    "studentName": "John Doe",
    "courseName": "Introduction to Programming",
    "grade": "A"
  },
  "universityId": "uuid"
}
```

**Response:**
```json
{
  "messageId": "uuid",
  "status": "queued",
  "queuedAt": "2024-01-15T10:30:00Z"
}
```

### POST /webhook

Receive delivery status updates from WhatsApp.

**Headers:**
```
X-Hub-Signature: sha256=...
```

**Request Body:**
```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "statuses": [
              {
                "id": "message_id",
                "status": "delivered",
                "timestamp": "1642248600"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true
}
```

### GET /webhook

Webhook verification endpoint (required by WhatsApp).

**Query Parameters:**
- `hub.mode` - Should be "subscribe"
- `hub.verify_token` - Your verification token
- `hub.challenge` - Challenge string to echo back

**Response:**
Returns the challenge string if verification succeeds.

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "whatsapp-service",
  "redis": "connected",
  "database": "connected"
}
```

## Integration from Core Backend

### 1. Queue Message via Redis

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function sendWhatsAppNotification(phone: string, message: string, universityId: string) {
  const messageData = {
    phone,
    message,
    universityId,
    timestamp: new Date().toISOString(),
  };
  
  await redis.lpush('whatsapp:queue', JSON.stringify(messageData));
}
```

### 2. Direct HTTP Call

```typescript
import axios from 'axios';

async function sendWhatsAppMessage(phone: string, message: string, universityId: string) {
  try {
    const response = await axios.post('http://whatsapp-service:8002/send-message', {
      phone,
      message,
      universityId,
    });
    
    return response.data;
  } catch (error) {
    console.error('WhatsApp service error:', error);
    // Handle gracefully - don't block main operation
  }
}
```

## Message Queue Processing

The WhatsApp Service continuously processes messages from the Redis queue:

```python
async def process_queue():
    while True:
        # Get message from queue
        message_data = await redis.rpop('whatsapp:queue')
        
        if message_data:
            # Process message
            await send_whatsapp_message(message_data)
        
        await asyncio.sleep(0.1)
```

## Retry Logic

Failed messages are automatically retried with exponential backoff:

```
Attempt 1: Immediate
Attempt 2: 1 second delay
Attempt 3: 2 seconds delay
Attempt 4: 4 seconds delay (final)
```

After 3 failed attempts, the message is marked as permanently failed.

## Message Status Flow

```
queued → sending → sent → delivered
                    ↓
                  failed → retry → sent → delivered
                    ↓
                  failed (after 3 retries)
```

## Webhook Configuration

### 1. Configure Webhook URL in WhatsApp Business

1. Go to WhatsApp Business API Dashboard
2. Navigate to Configuration → Webhooks
3. Set Callback URL: `https://your-domain.com/webhook`
4. Set Verify Token: Your `WEBHOOK_VERIFY_TOKEN`
5. Subscribe to message status events

### 2. Verify Webhook

WhatsApp will send a GET request to verify your webhook:

```
GET /webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE_STRING
```

Your service must return the challenge string.

### 3. Handle Status Updates

When message status changes, WhatsApp sends a POST request:

```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "statuses": [
              {
                "id": "wamid.xxx",
                "status": "delivered",
                "timestamp": "1642248600",
                "recipient_id": "2348012345678"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## Message Templates

WhatsApp requires pre-approved templates for business messages.

### Creating Templates

1. Go to WhatsApp Business Manager
2. Navigate to Message Templates
3. Create template with placeholders
4. Wait for approval (usually 24-48 hours)

### Example Templates

**Grade Notification:**
```
Hello {{1}},

Your grade for {{2}} has been published: {{3}}

View your full results at: {{4}}

- UniSense Team
```

**Fee Reminder:**
```
Dear {{1}},

This is a reminder that you have an outstanding fee balance of ₦{{2}} for the {{3}} session.

Please visit the finance office or pay online at: {{4}}

- UniSense Finance Office
```

**Announcement:**
```
{{1}}

{{2}}

For more information, visit: {{3}}

- {{4}}
```

## Error Handling

### Common Errors

1. **Invalid Phone Number**
   - Error: `INVALID_PHONE_NUMBER`
   - Solution: Validate phone format before sending

2. **Rate Limit Exceeded**
   - Error: `RATE_LIMIT_EXCEEDED`
   - Solution: Implement rate limiting in Core Backend

3. **Template Not Found**
   - Error: `TEMPLATE_NOT_FOUND`
   - Solution: Ensure template is approved in WhatsApp Business

4. **Insufficient Balance**
   - Error: `INSUFFICIENT_BALANCE`
   - Solution: Top up WhatsApp Business account

### Error Response Format

```json
{
  "error": {
    "code": "WHATSAPP_API_ERROR",
    "message": "Failed to send message",
    "details": {
      "whatsappError": "Invalid phone number format",
      "phone": "+234801234567"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Monitoring

### Key Metrics

- **Queue Depth** - Number of pending messages
- **Success Rate** - Percentage of successfully delivered messages
- **Average Delivery Time** - Time from queue to delivery
- **Retry Rate** - Percentage of messages requiring retries
- **Error Rate** - Percentage of permanently failed messages

### Logging

All messages are logged to the database:

```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(retry_count) as avg_retries
FROM whatsapp_messages
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status;
```

### Alerts

Set up alerts for:
- Queue depth > 1000 messages
- Error rate > 5%
- Service downtime > 1 minute
- Webhook failures

## Testing

### Local Testing

1. Use WhatsApp Test Numbers (provided by WhatsApp)
2. Mock WhatsApp API responses
3. Test webhook with ngrok

```bash
# Start ngrok tunnel
ngrok http 8002

# Update webhook URL in WhatsApp Business
# URL: https://your-ngrok-url.ngrok.io/webhook
```

### Integration Testing

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_send_message():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/send-message", json={
            "phone": "+2348012345678",
            "message": "Test message",
            "universityId": "test-uuid"
        })
        
        assert response.status_code == 202
        assert response.json()["status"] == "queued"
```

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
```

### Docker Compose

```yaml
whatsapp-service:
  build: ./whatsapp-service
  ports:
    - "8002:8002"
  environment:
    - WHATSAPP_API_URL=${WHATSAPP_API_URL}
    - WHATSAPP_API_TOKEN=${WHATSAPP_API_TOKEN}
    - REDIS_URL=redis://redis:6379
    - DATABASE_URL=${DATABASE_URL}
  depends_on:
    - redis
    - postgres
```

### Production Considerations

1. **Scaling**
   - Run multiple instances behind load balancer
   - Use Redis cluster for high availability
   - Implement distributed locking for queue processing

2. **Security**
   - Validate webhook signatures
   - Use HTTPS for all communications
   - Rotate API tokens regularly
   - Implement rate limiting

3. **Reliability**
   - Set up health checks
   - Implement circuit breakers
   - Use dead letter queue for failed messages
   - Monitor queue depth

## Troubleshooting

### Messages Not Sending

1. Check Redis connection
2. Verify WhatsApp API credentials
3. Check message format
4. Review error logs

### Webhook Not Receiving Updates

1. Verify webhook URL is accessible
2. Check verify token matches
3. Ensure HTTPS is enabled
4. Review WhatsApp Business webhook configuration

### High Retry Rate

1. Check WhatsApp API status
2. Verify phone number formats
3. Review rate limits
4. Check network connectivity

## Best Practices

1. **Phone Number Validation**
   - Always validate phone numbers before queuing
   - Use E.164 format (+234...)
   - Store country codes

2. **Message Content**
   - Keep messages concise
   - Use approved templates for business messages
   - Include opt-out instructions

3. **Rate Limiting**
   - Implement rate limiting in Core Backend
   - Batch messages when possible
   - Respect WhatsApp rate limits

4. **Error Handling**
   - Log all errors with context
   - Implement graceful degradation
   - Don't block main operations on WhatsApp failures

5. **Monitoring**
   - Track delivery rates
   - Monitor queue depth
   - Set up alerts for anomalies

## Support

For WhatsApp Service support:
- Email: whatsapp-support@unisense.com
- Documentation: https://docs.unisense.com/whatsapp
- WhatsApp Business API Docs: https://developers.facebook.com/docs/whatsapp

## License

Proprietary - UniSense Platform

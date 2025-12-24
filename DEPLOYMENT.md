# UniSense Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Database Setup](#database-setup)
6. [Service Configuration](#service-configuration)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Backup and Recovery](#backup-and-recovery)
9. [Scaling](#scaling)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum (Development):**

- 4 CPU cores
- 8 GB RAM
- 50 GB storage
- Ubuntu 20.04+ or similar Linux distribution

**Recommended (Production):**

- 8+ CPU cores
- 16+ GB RAM
- 200+ GB SSD storage
- Ubuntu 22.04 LTS

### Required Software

- Docker 24.0+
- Docker Compose 2.20+
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### External Services

- **WhatsApp Business API** - For WhatsApp notifications
- **Email Service** - SMTP server or service (SendGrid, AWS SES, etc.)
- **SMS Gateway** - For SMS notifications (Twilio, Africa's Talking, etc.)
- **Domain Name** - For production deployment
- **SSL Certificate** - Let's Encrypt or commercial

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/unisense.git
cd unisense
```

### 2. Create Environment Files

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=unisense
DB_PASSWORD=your_secure_password_here
DB_NAME=unisense

# Redis Configuration
REDIS_URL=redis://redis:6379

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRATION=24h

# Core Backend
BACKEND_PORT=3000
NODE_ENV=production

# Frontend
FRONTEND_PORT=3001
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# AI Service
AI_SERVICE_PORT=8001
AI_SERVICE_URL=http://ai-service:8001

# WhatsApp Service
WHATSAPP_SERVICE_PORT=8002
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_TOKEN=your_whatsapp_token
WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@your-domain.com

# SMS Configuration
SMS_PROVIDER=twilio
SMS_API_KEY=your_sms_api_key
SMS_API_SECRET=your_sms_api_secret
SMS_FROM=+1234567890

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

### 3. Generate Secrets

Generate secure secrets for production:

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate webhook verify token
openssl rand -hex 32
```

---

## Docker Deployment

### Development Environment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Environment

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Verify Deployment

```bash
# Check service health
curl http://localhost:3000/health  # Backend
curl http://localhost:8001/health  # AI Service
curl http://localhost:8002/health  # WhatsApp Service

# Check database connection
docker-compose exec postgres psql -U unisense -d unisense -c "SELECT 1;"

# Check Redis connection
docker-compose exec redis redis-cli ping
```

---

## Production Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create unisense user
sudo useradd -m -s /bin/bash unisense
sudo usermod -aG docker unisense

# Switch to unisense user
sudo su - unisense
```

### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-org/unisense.git
cd unisense

# Create environment file
cp .env.example .env
nano .env  # Edit with production values

# Create data directories
mkdir -p data/postgres data/redis logs
```

### 3. SSL Certificate Setup

Using Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com -d api.your-domain.com

# Certificates will be in:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### 4. Nginx Reverse Proxy

Create `/etc/nginx/sites-available/unisense`:

```nginx
# Frontend
server {
    listen 80;
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/unisense /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Deploy Services

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migration:run

# Create initial admin user
docker-compose -f docker-compose.prod.yml exec backend npm run seed:admin
```

### 6. Verify Deployment

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test endpoints
curl https://api.your-domain.com/health
curl https://your-domain.com
```

---

## Database Setup

### Initial Setup

```bash
# Create database
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE unisense;"

# Create user
docker-compose exec postgres psql -U postgres -c "CREATE USER unisense WITH PASSWORD 'your_password';"

# Grant privileges
docker-compose exec postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE unisense TO unisense;"
```

### Run Migrations

```bash
# Run all migrations
docker-compose exec backend npm run migration:run

# Revert last migration
docker-compose exec backend npm run migration:revert

# Generate new migration
docker-compose exec backend npm run migration:generate -- src/migrations/MigrationName
```

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U unisense unisense > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T postgres psql -U unisense unisense < backup_20240115_103000.sql
```

### Automated Backups

Create backup script `/home/unisense/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/unisense/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/unisense_$DATE.sql"

# Create backup
docker-compose -f /home/unisense/unisense/docker-compose.prod.yml exec -T postgres pg_dump -U unisense unisense > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp $BACKUP_FILE.gz s3://your-bucket/backups/
```

Add to crontab:

```bash
# Run daily at 2 AM
0 2 * * * /home/unisense/backup.sh
```

---

## Service Configuration

### Core Backend Configuration

Edit `backend/src/config/app.config.ts`:

```typescript
export default {
  port: process.env.BACKEND_PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
};
```

### AI Service Configuration

Edit `ai-service/config.py`:

```python
import os

DATABASE_URL = os.getenv('DATABASE_URL')
MODEL_PATH = os.getenv('MODEL_PATH', '/app/models')
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
CACHE_TTL = int(os.getenv('CACHE_TTL', 300))
```

### WhatsApp Service Configuration

Edit `whatsapp-service/config.py`:

```python
import os

WHATSAPP_API_URL = os.getenv('WHATSAPP_API_URL')
WHATSAPP_API_TOKEN = os.getenv('WHATSAPP_API_TOKEN')
WEBHOOK_VERIFY_TOKEN = os.getenv('WEBHOOK_VERIFY_TOKEN')
REDIS_URL = os.getenv('REDIS_URL')
MAX_RETRIES = int(os.getenv('MAX_RETRIES', 3))
RETRY_DELAY = int(os.getenv('RETRY_DELAY', 1))
```

---

## Monitoring and Logging

### Structured Logging

All services use structured JSON logging:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "service": "backend",
  "message": "User logged in",
  "userId": "uuid",
  "universityId": "uuid",
  "ip": "192.168.1.1"
}
```

### Log Aggregation

Using Docker logging driver:

```yaml
# docker-compose.prod.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Health Checks

All services expose `/health` endpoint:

```bash
# Check service health
curl http://localhost:3000/health

# Response
{
  "status": "healthy",
  "service": "backend",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Monitoring with Prometheus

Add Prometheus configuration:

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'unisense-backend'
    static_configs:
      - targets: ['backend:3000']
  
  - job_name: 'unisense-ai'
    static_configs:
      - targets: ['ai-service:8001']
  
  - job_name: 'unisense-whatsapp'
    static_configs:
      - targets: ['whatsapp-service:8002']
```

### Grafana Dashboards

Import pre-built dashboards for:

- API response times
- Error rates
- Database performance
- Queue depth
- Message delivery rates

---

## Backup and Recovery

### Backup Strategy

1. **Database Backups**
   - Daily full backups
   - Hourly incremental backups
   - 30-day retention

2. **File Backups**
   - Configuration files
   - SSL certificates
   - Environment files

3. **Off-site Backups**
   - Upload to S3/Cloud Storage
   - Geographic redundancy

### Recovery Procedures

#### Database Recovery

```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore database
docker-compose -f docker-compose.prod.yml up -d postgres
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U unisense unisense < backup.sql

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

#### Full System Recovery

```bash
# Restore configuration
cp backup/.env .env
cp backup/docker-compose.prod.yml docker-compose.prod.yml

# Restore database
docker-compose -f docker-compose.prod.yml up -d postgres
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U unisense unisense < backup.sql

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl https://api.your-domain.com/health
```

---

## Scaling

### Horizontal Scaling

#### Backend Service

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

#### Load Balancer

Use Nginx upstream:

```nginx
upstream backend {
    least_conn;
    server backend-1:3000;
    server backend-2:3000;
    server backend-3:3000;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

### Database Scaling

#### Read Replicas

```yaml
services:
  postgres-primary:
    image: postgres:15-alpine
    environment:
      POSTGRES_REPLICATION_MODE: master
  
  postgres-replica:
    image: postgres:15-alpine
    environment:
      POSTGRES_REPLICATION_MODE: slave
      POSTGRES_MASTER_HOST: postgres-primary
```

#### Connection Pooling

Use PgBouncer:

```yaml
services:
  pgbouncer:
    image: pgbouncer/pgbouncer
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_USER: unisense
      DATABASES_PASSWORD: password
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 25
```

### Redis Scaling

#### Redis Cluster

```yaml
services:
  redis-1:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes
  
  redis-2:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes
  
  redis-3:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes
```

---

## Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check logs
docker-compose logs backend

# Check port conflicts
sudo netstat -tulpn | grep :3000

# Rebuild images
docker-compose build --no-cache
docker-compose up -d
```

#### Database Connection Errors

```bash
# Check database is running
docker-compose ps postgres

# Check connection
docker-compose exec postgres psql -U unisense -d unisense -c "SELECT 1;"

# Check environment variables
docker-compose exec backend env | grep DB_
```

#### High Memory Usage

```bash
# Check container stats
docker stats

# Restart services
docker-compose restart

# Increase memory limits
# Edit docker-compose.prod.yml
```

#### Slow API Response

```bash
# Check database queries
docker-compose exec postgres psql -U unisense -d unisense -c "SELECT * FROM pg_stat_activity;"

# Check Redis
docker-compose exec redis redis-cli INFO stats

# Enable query logging
# Edit backend configuration
```

### Performance Tuning

#### PostgreSQL

```sql
-- Increase shared buffers
ALTER SYSTEM SET shared_buffers = '2GB';

-- Increase work memory
ALTER SYSTEM SET work_mem = '50MB';

-- Enable query planning
ALTER SYSTEM SET enable_partitionwise_join = on;

-- Reload configuration
SELECT pg_reload_conf();
```

#### Redis

```bash
# Increase max memory
redis-cli CONFIG SET maxmemory 2gb

# Set eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable SSL/TLS for all services
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up fail2ban
- [ ] Regular security updates
- [ ] Enable audit logging
- [ ] Implement backup encryption
- [ ] Configure CORS properly
- [ ] Use secrets management
- [ ] Enable database encryption
- [ ] Set up intrusion detection
- [ ] Regular security audits

---

## Maintenance

### Regular Tasks

**Daily:**

- Check service health
- Review error logs
- Monitor disk space

**Weekly:**

- Review performance metrics
- Check backup integrity
- Update dependencies

**Monthly:**

- Security updates
- Database optimization
- Review access logs
- Capacity planning

### Update Procedure

```bash
# Pull latest code
git pull origin main

# Backup database
./backup.sh

# Rebuild images
docker-compose -f docker-compose.prod.yml build

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migration:run

# Restart services (zero-downtime)
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend

# Verify
curl https://api.your-domain.com/health
```

---

## Support

For deployment support:

- Email:devops@unisense.com
- Documentation:<https://docs.unisense.com/deployment>
- Emergency: +234 XXX XXX XXXX

---

*Last Updated: January 2024*  
*Version: 1.0*

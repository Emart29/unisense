# UniSense Setup Guide

This guide will help you set up the UniSense platform for development or production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Manual Setup](#manual-setup)
4. [Configuration](#configuration)
5. [Database Setup](#database-setup)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Docker** (version 20.10+) and **Docker Compose** (version 2.0+)
- **Git** for version control

### Optional (for local development without Docker)

- **Node.js** 20+ and **npm**
- **Python** 3.11+
- **PostgreSQL** 15+
- **Redis** 7+

## Quick Start

The fastest way to get UniSense running is using the provided Makefile:

```bash
# Clone the repository
git clone <repository-url>
cd unisense

# Run the setup command (copies env files, starts services, runs migrations)
make setup
```

This will:
1. Copy all `.env.example` files to `.env`
2. Start all services with Docker Compose
3. Run database migrations
4. Display access URLs for all services

## Manual Setup

If you prefer to set up manually or the Makefile doesn't work on your system:

### Step 1: Environment Configuration

Copy the environment files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ai-service/.env.example ai-service/.env
cp whatsapp-service/.env.example whatsapp-service/.env
```

### Step 2: Configure Environment Variables

Edit each `.env` file with your specific configuration:

**Root `.env`:**
- Set `JWT_SECRET` to a secure random string
- Configure `EMAIL_API_KEY` and `SMS_API_KEY` if you have them
- Set `WHATSAPP_API_TOKEN` and `WEBHOOK_SECRET` for WhatsApp integration

**Backend `.env`:**
- Ensure `DATABASE_URL` matches your PostgreSQL configuration
- Set `JWT_SECRET` (same as root)
- Configure external service API keys

**Frontend `.env`:**
- Set `NEXT_PUBLIC_API_URL` to your backend URL

**AI Service `.env`:**
- Set `DATABASE_URL` (read-only access recommended)

**WhatsApp Service `.env`:**
- Configure WhatsApp Business API credentials
- Set `REDIS_URL` and `DATABASE_URL`

### Step 3: Start Services

```bash
docker-compose up -d
```

### Step 4: Run Database Migrations

```bash
docker-compose exec backend npm run migration:run
```

### Step 5: Verify Services

Check that all services are running:

```bash
docker-compose ps
```

Access the services:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- AI Service: http://localhost:8001
- WhatsApp Service: http://localhost:8002

## Configuration

### Database Configuration

The default configuration uses PostgreSQL with the following credentials:
- Database: `unisense`
- User: `unisense_user`
- Password: `unisense_password`

**For production**, change these in your `.env` file:

```env
DATABASE_URL=postgresql://your_user:your_password@postgres:5432/your_database
```

### JWT Configuration

Generate a secure JWT secret:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add it to your `.env` files:

```env
JWT_SECRET=your_generated_secret_here
```

### WhatsApp Configuration

To enable WhatsApp notifications:

1. Set up a WhatsApp Business API account
2. Get your API token and phone number ID
3. Configure in `.env`:

```env
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_TOKEN=your_token_here
WEBHOOK_SECRET=your_webhook_secret
```

### Email and SMS Configuration

Configure your email and SMS providers:

```env
EMAIL_API_KEY=your_email_api_key
SMS_API_KEY=your_sms_api_key
```

## Database Setup

### Initial Migration

The initial migration creates all required tables:

```bash
docker-compose exec backend npm run migration:run
```

### Creating New Migrations

When you modify entities:

```bash
# Generate migration from entity changes
docker-compose exec backend npm run migration:generate -- src/migrations/YourMigrationName

# Or create an empty migration
docker-compose exec backend npm run migration:create -- src/migrations/YourMigrationName
```

### Reverting Migrations

To revert the last migration:

```bash
docker-compose exec backend npm run migration:revert
```

### Seeding Data (Optional)

To add sample data for testing:

```bash
# Create a seed script in backend/src/seeds/
docker-compose exec backend npm run seed
```

## Troubleshooting

### Services Won't Start

**Check Docker is running:**
```bash
docker --version
docker-compose --version
```

**Check for port conflicts:**
```bash
# Check if ports are already in use
netstat -an | grep 3000  # Backend
netstat -an | grep 3001  # Frontend
netstat -an | grep 5432  # PostgreSQL
netstat -an | grep 6379  # Redis
netstat -an | grep 8001  # AI Service
netstat -an | grep 8002  # WhatsApp Service
```

**View service logs:**
```bash
docker-compose logs backend
docker-compose logs postgres
```

### Database Connection Issues

**Verify PostgreSQL is running:**
```bash
docker-compose ps postgres
```

**Check database logs:**
```bash
docker-compose logs postgres
```

**Test connection:**
```bash
docker-compose exec postgres psql -U unisense_user -d unisense
```

### Migration Errors

**Reset database (WARNING: destroys all data):**
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend npm run migration:run
```

**Check migration status:**
```bash
docker-compose exec backend npm run typeorm -- migration:show -d src/config/typeorm.config.ts
```

### Frontend Build Issues

**Clear Next.js cache:**
```bash
docker-compose exec frontend rm -rf .next
docker-compose restart frontend
```

### Python Service Issues

**Rebuild Python services:**
```bash
docker-compose build ai-service whatsapp-service
docker-compose up -d ai-service whatsapp-service
```

**Check Python logs:**
```bash
docker-compose logs ai-service
docker-compose logs whatsapp-service
```

## Production Deployment

For production deployment:

1. Use `docker-compose.prod.yml`:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

2. Set `NODE_ENV=production` in all `.env` files

3. Use strong, unique secrets for all credentials

4. Enable HTTPS/TLS for all services

5. Set up proper backup procedures for PostgreSQL

6. Configure monitoring and logging

7. Set up a reverse proxy (nginx/Traefik) for SSL termination

## Getting Help

If you encounter issues not covered here:

1. Check the logs: `docker-compose logs [service-name]`
2. Review the main README.md
3. Check the GitHub issues
4. Contact the development team

## Next Steps

After setup is complete:

1. Create your first university tenant
2. Set up user accounts with different roles
3. Import student data
4. Configure courses and fee structures
5. Test the AI analytics features

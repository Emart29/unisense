#!/bin/bash

# UniSense Health Check Script
# This script checks if all services are running and healthy

set -e

echo "🏥 UniSense Health Check"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $service_name... "
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
        if [ "$response" -eq "$expected_status" ]; then
            echo -e "${GREEN}✓ Healthy${NC} (HTTP $response)"
            return 0
        else
            echo -e "${YELLOW}⚠ Warning${NC} (HTTP $response, expected $expected_status)"
            return 1
        fi
    else
        echo -e "${RED}✗ Unreachable${NC}"
        return 1
    fi
}

# Function to check Docker container
check_container() {
    local container_name=$1
    
    echo -n "Checking $container_name container... "
    
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        status=$(docker inspect --format='{{.State.Status}}' "$container_name")
        if [ "$status" = "running" ]; then
            echo -e "${GREEN}✓ Running${NC}"
            return 0
        else
            echo -e "${RED}✗ Not running${NC} (Status: $status)"
            return 1
        fi
    else
        echo -e "${RED}✗ Not found${NC}"
        return 1
    fi
}

# Check Docker containers
echo "📦 Docker Containers:"
check_container "unisense-postgres"
check_container "unisense-redis"
check_container "unisense-backend"
check_container "unisense-frontend"
check_container "unisense-ai-service"
check_container "unisense-whatsapp-service"
echo ""

# Check service endpoints
echo "🌐 Service Endpoints:"
check_service "Backend API" "http://localhost:3000/health" 200
check_service "Frontend" "http://localhost:3001" 200
check_service "AI Service" "http://localhost:8001/health" 200
check_service "WhatsApp Service" "http://localhost:8002/health" 200
echo ""

# Check database connection
echo "🗄️  Database:"
echo -n "Checking PostgreSQL connection... "
if docker exec unisense-postgres pg_isready -U unisense_user -d unisense > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Connection failed${NC}"
fi
echo ""

# Check Redis connection
echo "💾 Cache:"
echo -n "Checking Redis connection... "
if docker exec unisense-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Connection failed${NC}"
fi
echo ""

echo "========================"
echo "Health check complete!"

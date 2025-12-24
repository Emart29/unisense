#!/bin/bash

# UniSense Database Backup Script
# Creates a backup of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="unisense_backup_${TIMESTAMP}.sql"
CONTAINER_NAME="unisense-postgres"
DB_NAME="unisense"
DB_USER="unisense_user"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🗄️  UniSense Database Backup"
echo "============================"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}Error: PostgreSQL container is not running${NC}"
    exit 1
fi

echo "Creating backup..."
echo "Database: $DB_NAME"
echo "File: $BACKUP_DIR/$BACKUP_FILE"
echo ""

# Create backup
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"; then
    # Compress backup
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    COMPRESSED_FILE="${BACKUP_FILE}.gz"
    
    # Get file size
    SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_FILE" | cut -f1)
    
    echo -e "${GREEN}✓ Backup created successfully${NC}"
    echo "File: $BACKUP_DIR/$COMPRESSED_FILE"
    echo "Size: $SIZE"
    echo ""
    
    # Clean up old backups (keep last 7 days)
    echo "Cleaning up old backups (keeping last 7 days)..."
    find "$BACKUP_DIR" -name "unisense_backup_*.sql.gz" -mtime +7 -delete
    
    REMAINING=$(find "$BACKUP_DIR" -name "unisense_backup_*.sql.gz" | wc -l)
    echo "Backups remaining: $REMAINING"
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

echo ""
echo "============================"
echo "Backup complete!"

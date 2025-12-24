#!/bin/bash

# UniSense Database Restore Script
# Restores a PostgreSQL database from backup

set -e

# Configuration
BACKUP_DIR="./backups"
CONTAINER_NAME="unisense-postgres"
DB_NAME="unisense"
DB_USER="unisense_user"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🗄️  UniSense Database Restore"
echo "============================="
echo ""

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/unisense_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 backups/unisense_backup_20240101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}Error: PostgreSQL container is not running${NC}"
    exit 1
fi

echo -e "${YELLOW}WARNING: This will replace the current database!${NC}"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled"
    exit 0
fi

echo "Creating safety backup of current database..."
SAFETY_BACKUP="$BACKUP_DIR/pre_restore_backup_$(date +"%Y%m%d_%H%M%S").sql"
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$SAFETY_BACKUP"
gzip "$SAFETY_BACKUP"
echo -e "${GREEN}✓ Safety backup created: ${SAFETY_BACKUP}.gz${NC}"
echo ""

echo "Decompressing backup file..."
TEMP_FILE="/tmp/restore_$(date +%s).sql"
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

echo "Dropping existing database..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS ${DB_NAME};"

echo "Creating new database..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -c "CREATE DATABASE ${DB_NAME};"

echo "Restoring database..."
if docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" "$DB_NAME" < "$TEMP_FILE"; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
    rm "$TEMP_FILE"
else
    echo -e "${RED}✗ Restore failed${NC}"
    echo "Safety backup available at: ${SAFETY_BACKUP}.gz"
    rm "$TEMP_FILE"
    exit 1
fi

echo ""
echo "============================="
echo "Restore complete!"

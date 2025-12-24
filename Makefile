.PHONY: help up down restart logs clean migrate migrate-revert test install

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

logs-ai: ## View AI service logs
	docker-compose logs -f ai-service

logs-whatsapp: ## View WhatsApp service logs
	docker-compose logs -f whatsapp-service

clean: ## Stop and remove all containers, volumes, and images
	docker-compose down -v --rmi all

migrate: ## Run database migrations
	docker-compose exec backend npm run migration:run

migrate-revert: ## Revert last migration
	docker-compose exec backend npm run migration:revert

migrate-create: ## Create a new migration (usage: make migrate-create name=MigrationName)
	docker-compose exec backend npm run migration:create -- src/migrations/$(name)

test: ## Run all tests
	docker-compose exec backend npm run test
	docker-compose exec ai-service pytest
	docker-compose exec whatsapp-service pytest

test-backend: ## Run backend tests
	docker-compose exec backend npm run test

test-ai: ## Run AI service tests
	docker-compose exec ai-service pytest

test-whatsapp: ## Run WhatsApp service tests
	docker-compose exec whatsapp-service pytest

install: ## Install dependencies for all services
	cd backend && npm install
	cd frontend && npm install
	cd ai-service && pip install -r requirements.txt
	cd whatsapp-service && pip install -r requirements.txt

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-ai: ## Open shell in AI service container
	docker-compose exec ai-service sh

shell-whatsapp: ## Open shell in WhatsApp service container
	docker-compose exec whatsapp-service sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U unisense_user -d unisense

shell-redis: ## Open Redis CLI
	docker-compose exec redis redis-cli

build: ## Build all Docker images
	docker-compose build

rebuild: ## Rebuild all Docker images without cache
	docker-compose build --no-cache

ps: ## Show running containers
	docker-compose ps

setup: ## Initial setup (copy env files, start services, run migrations)
	@echo "Setting up UniSense..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env file"; fi
	@if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; echo "Created backend/.env file"; fi
	@if [ ! -f frontend/.env ]; then cp frontend/.env.example frontend/.env; echo "Created frontend/.env file"; fi
	@if [ ! -f ai-service/.env ]; then cp ai-service/.env.example ai-service/.env; echo "Created ai-service/.env file"; fi
	@if [ ! -f whatsapp-service/.env ]; then cp whatsapp-service/.env.example whatsapp-service/.env; echo "Created whatsapp-service/.env file"; fi
	@echo "Starting services..."
	docker-compose up -d
	@echo "Waiting for services to be ready..."
	sleep 10
	@echo "Running migrations..."
	docker-compose exec backend npm run migration:run
	@echo "Setup complete! Access the services at:"
	@echo "  Frontend: http://localhost:3001"
	@echo "  Backend API: http://localhost:3000"
	@echo "  AI Service: http://localhost:8001"
	@echo "  WhatsApp Service: http://localhost:8002"

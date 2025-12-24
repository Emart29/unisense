# UniSense Services Startup Script
Write-Host "Starting UniSense services..." -ForegroundColor Green

# Set environment variables for backend
$env:DB_PASSWORD = "Kabiru29@"
$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_USERNAME = "postgres"
$env:DB_NAME = "unisense"
$env:NODE_ENV = "development"
$env:PORT = "3001"
$env:REDIS_URL = "redis://localhost:6379"
$env:AI_SERVICE_URL = "http://localhost:8001"
$env:JWT_SECRET = "unisense-secret-key-change-in-production"

Write-Host ""
Write-Host "Starting Backend (NestJS) on port 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; `$env:DB_PASSWORD='Kabiru29@'; `$env:DB_HOST='localhost'; `$env:DB_PORT='5432'; `$env:DB_USERNAME='postgres'; `$env:DB_NAME='unisense'; `$env:NODE_ENV='development'; `$env:PORT='3001'; `$env:REDIS_URL='redis://localhost:6379'; `$env:AI_SERVICE_URL='http://localhost:8001'; `$env:JWT_SECRET='unisense-secret-key-change-in-production'; npm run start:dev"

Write-Host "Waiting for Backend to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host "Starting AI Service (Python) on port 8001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\ai-service'; python -m uvicorn main:app --reload --port 8001"

Start-Sleep -Seconds 3

Write-Host "Starting WhatsApp Service (Python) on port 8002..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\whatsapp-service'; python -m uvicorn main:app --reload --port 8002"

Start-Sleep -Seconds 3

Write-Host "Starting Frontend (Next.js) on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; `$env:PORT='3000'; npm run dev"

Write-Host ""
Write-Host "=== UniSense Services Started ===" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:         http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API:      http://localhost:3001" -ForegroundColor Cyan
Write-Host "API Docs:         http://localhost:3001/api" -ForegroundColor Cyan
Write-Host "AI Service:       http://localhost:8001" -ForegroundColor Cyan
Write-Host "WhatsApp Service: http://localhost:8002" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Users (password: password123):" -ForegroundColor Yellow
Write-Host "  Admin:    admin@test.edu" -ForegroundColor White
Write-Host "  Dean:     dean@test.edu" -ForegroundColor White
Write-Host "  Lecturer: lecturer@test.edu" -ForegroundColor White
Write-Host "  Student:  student@test.edu" -ForegroundColor White
Write-Host "  Finance:  finance@test.edu" -ForegroundColor White
Write-Host ""
Write-Host "Services are starting in separate windows." -ForegroundColor Yellow
Write-Host "Backend should be ready in ~15 seconds, all services ready in ~30 seconds." -ForegroundColor Yellow

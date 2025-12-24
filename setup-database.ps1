# UniSense Database Setup Script
Write-Host "Setting up UniSense database..." -ForegroundColor Green

# Find PostgreSQL installation
$pgPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $pgPath)) {
    $pgPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
}
if (-not (Test-Path $pgPath)) {
    $pgPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
}
if (-not (Test-Path $pgPath)) {
    $pgPath = "C:\Program Files\PostgreSQL\15\bin\psql.exe"
}

if (-not (Test-Path $pgPath)) {
    Write-Host "PostgreSQL not found. Please ensure PostgreSQL is installed." -ForegroundColor Red
    exit 1
}

Write-Host "Found PostgreSQL at: $pgPath" -ForegroundColor Cyan

# Create database and user
Write-Host "Creating database and user..." -ForegroundColor Yellow
$env:PGPASSWORD = "Kabiru29@"

& $pgPath -U postgres -c "DROP DATABASE IF EXISTS unisense;"
& $pgPath -U postgres -c "CREATE DATABASE unisense;"
& $pgPath -U postgres -c "CREATE USER unisense_user WITH PASSWORD 'unisense_password';" 2>$null
& $pgPath -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE unisense TO unisense_user;"
& $pgPath -U postgres -d unisense -c "GRANT ALL ON SCHEMA public TO unisense_user;"

Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Database: unisense" -ForegroundColor Cyan
Write-Host "User: postgres" -ForegroundColor Cyan
Write-Host "Password: Kabiru29@" -ForegroundColor Cyan
Write-Host "Connection: postgresql://postgres:Kabiru29%40@localhost:5432/unisense" -ForegroundColor Cyan

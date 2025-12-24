# UniSense Database Seed Script - Create Test Users
Write-Host "Seeding UniSense database with test data..." -ForegroundColor Green

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
$env:PGPASSWORD = "Kabiru29@"

# Create test university
Write-Host "Creating test university..." -ForegroundColor Yellow
& $pgPath -U postgres -d unisense -c "INSERT INTO universities (id, name, code) VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Test University', 'TEST_UNI') ON CONFLICT DO NOTHING;"

# Create test users with hashed passwords (password: 'password123')
# Hash generated using bcrypt with 12 rounds
$hashedPassword = '$2b$12$l3P26mL2h6/d5TpHxZk7JuzP5K7l1TlSy9tH7bXtaiBEGTZQfQHh6'

Write-Host "Creating test users..." -ForegroundColor Yellow

# Admin user
& $pgPath -U postgres -d unisense -c "INSERT INTO users (id, university_id, email, password_hash, role) VALUES ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'admin@test.edu', '$hashedPassword', 'ADMIN') ON CONFLICT (email) DO NOTHING;"

# Dean user
& $pgPath -U postgres -d unisense -c "INSERT INTO users (id, university_id, email, password_hash, role) VALUES ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'dean@test.edu', '$hashedPassword', 'DEAN') ON CONFLICT (email) DO NOTHING;"

# Lecturer user
& $pgPath -U postgres -d unisense -c "INSERT INTO users (id, university_id, email, password_hash, role) VALUES ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'lecturer@test.edu', '$hashedPassword', 'LECTURER') ON CONFLICT (email) DO NOTHING;"

# Student user
& $pgPath -U postgres -d unisense -c "INSERT INTO users (id, university_id, email, password_hash, role) VALUES ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'student@test.edu', '$hashedPassword', 'STUDENT') ON CONFLICT (email) DO NOTHING;"

# Finance user
& $pgPath -U postgres -d unisense -c "INSERT INTO users (id, university_id, email, password_hash, role) VALUES ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'finance@test.edu', '$hashedPassword', 'FINANCE') ON CONFLICT (email) DO NOTHING;"

Write-Host ""
Write-Host "Database seeded successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "=== Test Users Created ===" -ForegroundColor Cyan
Write-Host "All users have password: password123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Admin:    admin@test.edu" -ForegroundColor White
Write-Host "Dean:     dean@test.edu" -ForegroundColor White
Write-Host "Lecturer: lecturer@test.edu" -ForegroundColor White
Write-Host "Student:  student@test.edu" -ForegroundColor White
Write-Host "Finance:  finance@test.edu" -ForegroundColor White
Write-Host ""
Write-Host "University: Test University (TEST_UNI)" -ForegroundColor Cyan

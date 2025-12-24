# UniSense Services Stop Script
Write-Host "Stopping UniSense services..." -ForegroundColor Yellow

# Stop Node processes (Backend and Frontend)
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
Write-Host "Stopped Node.js processes (Backend & Frontend)" -ForegroundColor Green

# Stop Python processes (AI Service and WhatsApp Service)
Get-Process | Where-Object {$_.ProcessName -eq "python"} | Stop-Process -Force
Write-Host "Stopped Python processes (AI & WhatsApp Services)" -ForegroundColor Green

Write-Host ""
Write-Host "All UniSense services stopped." -ForegroundColor Green

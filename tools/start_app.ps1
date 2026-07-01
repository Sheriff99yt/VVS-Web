Write-Host "Starting VVS 2.0 Development Environment..." -ForegroundColor Green

# $PSScriptRoot is the directory containing this script.
$projectRoot = Split-Path -Parent $PSScriptRoot

# Start Next.js Frontend
$webPath = Join-Path $projectRoot "apps\web"
if (Test-Path $webPath) {
    Write-Host "Starting Next.js Frontend (apps/web)..." -ForegroundColor Cyan
    Start-Process powershell -WorkingDirectory $webPath -ArgumentList "-NoExit", "-Command", "bun run dev"
} else {
    Write-Host "Warning: apps\web directory not found. Skipping Next.js." -ForegroundColor Yellow
}

# Start Go Backend
$serverPath = Join-Path $projectRoot "server"
if (Test-Path $serverPath) {
    Write-Host "Starting Go Backend (server) - skeleton, GET /health only..." -ForegroundColor Cyan
    Start-Process powershell -WorkingDirectory $serverPath -ArgumentList "-NoExit", "-Command", "go run ./cmd/vvs-server"
} else {
    Write-Host "Warning: server directory not found. Skipping Go Backend." -ForegroundColor Yellow
}

Write-Host "Services launched in new windows." -ForegroundColor Green

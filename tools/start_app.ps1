Write-Host "Starting VVS 2.0 Development Environment..." -ForegroundColor Green

# $PSScriptRoot is the directory containing this script.
$projectRoot = Split-Path -Parent $PSScriptRoot

# HTTP API mode - web app talks to Go server + local MCP (Connect AI modal).
$apiMode = "http"
$apiUrl = "http://localhost:8080"

# Start Next.js Frontend
$webPath = Join-Path $projectRoot "apps\web"
if (Test-Path $webPath) {
    Write-Host "Starting Next.js Frontend (apps/web, API mode: $apiMode)..." -ForegroundColor Cyan
    $webCommand = "`$env:NEXT_PUBLIC_API_MODE='$apiMode'; `$env:NEXT_PUBLIC_API_URL='$apiUrl'; bun run dev"
    Start-Process powershell -WorkingDirectory $webPath -ArgumentList "-NoExit", "-Command", $webCommand
} else {
    Write-Host "Warning: apps\web directory not found. Skipping Next.js." -ForegroundColor Yellow
}

# Start Go Backend (project API, registry, compile, MCP SSE)
$serverPath = Join-Path $projectRoot "server"
if (Test-Path $serverPath) {
    Write-Host "Starting Go Backend (server) - API + MCP at ${apiUrl}/mcp ..." -ForegroundColor Cyan
    # Default: in-memory store (no DATABASE_URL). To test Postgres persistence:
    #   docker compose up -d postgres
    #   $env:DATABASE_URL = "postgres://vvs:vvs_dev_password@localhost:5432/vvs?sslmode=disable"
    Start-Process powershell -WorkingDirectory $serverPath -ArgumentList "-NoExit", "-Command", "go run ./cmd/vvs-server"
} else {
    Write-Host "Warning: server directory not found. Skipping Go Backend." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Services launched in new windows." -ForegroundColor Green
Write-Host "  Web:  http://localhost:3000" -ForegroundColor White
Write-Host "  API:  ${apiUrl}/health" -ForegroundColor White
Write-Host "  MCP:  ${apiUrl}/mcp  (Connect AI in TopNav; point Cursor or Claude here)" -ForegroundColor White

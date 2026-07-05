Write-Host "VVS 2.0 - Environment Setup Script (Windows)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $PSScriptRoot
$webPath = Join-Path $projectRoot "apps\web"
$serverPath = Join-Path $projectRoot "server"

function Test-CommandExists {
    param ($command)
    return $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
}

function Get-LanIPv4 {
    $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notlike '127.*' -and
            $_.IPAddress -notlike '169.254.*' -and
            $_.IPAddress -match '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)'
        } |
        Sort-Object InterfaceMetric

    if ($candidates) {
        return ($candidates | Select-Object -First 1).IPAddress
    }
    return $null
}

function Ensure-HttpApiEnv {
    param ([string]$EnvLocalPath)

    if (-not (Test-Path $EnvLocalPath)) {
        return
    }

    $lines = @(Get-Content $EnvLocalPath)
    $changed = $false

    if (-not ($lines | Where-Object { $_ -match '^\s*NEXT_PUBLIC_API_MODE\s*=' })) {
        $lines += "NEXT_PUBLIC_API_MODE=http"
        $changed = $true
    }
    if (-not ($lines | Where-Object { $_ -match '^\s*NEXT_PUBLIC_API_URL\s*=' })) {
        $lines += "NEXT_PUBLIC_API_URL=http://localhost:8080"
        $changed = $true
    }

    if ($changed) {
        Set-Content -Path $EnvLocalPath -Value ($lines -join "`n").TrimEnd() -Encoding utf8
        Write-Host "  Added HTTP API + MCP settings to apps/web/.env.local" -ForegroundColor Green
    }
}

function Ensure-WebEnvLocal {
    param ([string]$LanIp)

    $envExample = Join-Path $webPath ".env.example"
    $envLocal = Join-Path $webPath ".env.local"

    if (Test-Path $envLocal) {
        Write-Host "  apps/web/.env.local already exists (not overwritten)" -ForegroundColor DarkGray
        Ensure-HttpApiEnv -EnvLocalPath $envLocal
        return
    }

    if (-not (Test-Path $envExample)) {
        Write-Host "  Warning: apps/web/.env.example not found" -ForegroundColor Yellow
        return
    }

    $content = Get-Content $envExample -Raw
    if ($LanIp) {
        $content += "`nDEV_ALLOWED_ORIGIN=$LanIp`n"
        Write-Host "  Created apps/web/.env.local with DEV_ALLOWED_ORIGIN=$LanIp" -ForegroundColor Green
    } else {
        Write-Host "  Created apps/web/.env.local from template (set DEV_ALLOWED_ORIGIN for LAN access)" -ForegroundColor Green
    }

    Set-Content -Path $envLocal -Value $content.TrimEnd() -Encoding utf8
    Write-Host "  Note: .env.local is gitignored and will not be committed" -ForegroundColor DarkGray
}

# 1. Bun
Write-Host "`nChecking for Bun..." -ForegroundColor Yellow
if (Test-CommandExists "bun") {
    $bunVer = bun --version
    Write-Host "  Bun $bunVer" -ForegroundColor Green
} else {
    Write-Host "  Installing Bun..." -ForegroundColor Cyan
    Invoke-RestMethod -Uri "https://bun.sh/install.ps1" | Invoke-Expression
    $bunBin = Join-Path $env:USERPROFILE ".bun\bin"
    if ($env:Path -notmatch [regex]::Escape($bunBin) -and (Test-Path $bunBin)) {
        $env:Path += ";$bunBin"
    }
    Write-Host "  Bun installed" -ForegroundColor Green
}

# 2. Go (optional — server skeleton)
Write-Host "`nChecking for Go..." -ForegroundColor Yellow
if (Test-CommandExists "go") {
    Write-Host "  $(go version)" -ForegroundColor Green
} else {
    Write-Host "  Go not found (optional for server work)" -ForegroundColor DarkYellow
    if (Test-CommandExists "winget") {
        Write-Host "  Attempting Go install via winget..." -ForegroundColor Cyan
        winget install GoLang.Go --source winget --accept-package-agreements --accept-source-agreements
        Write-Host "  Go install requested - restart terminal if 'go' is not found" -ForegroundColor Green
    } else {
        Write-Host "  Download from https://go.dev/dl/ if you need the Go server" -ForegroundColor DarkYellow
    }
}

# 3. Git
Write-Host "`nChecking for Git..." -ForegroundColor Yellow
if (Test-CommandExists "git") {
    Write-Host "  $(git --version)" -ForegroundColor Green
} else {
    Write-Host "  Git not found - install from https://git-scm.com/" -ForegroundColor Red
}

# 4. Frontend dependencies
Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Yellow
if (Test-Path $webPath) {
    Push-Location $webPath
    try {
        bun install
        Write-Host "  bun install complete (apps/web)" -ForegroundColor Green
    } finally {
        Pop-Location
    }
} else {
    Write-Host "  apps/web not found - skipping" -ForegroundColor Red
}

# 5. Local env file (gitignored)
Write-Host "`nConfiguring local environment..." -ForegroundColor Yellow
$lanIp = Get-LanIPv4
if ($lanIp) {
    Write-Host "  Detected LAN IPv4: $lanIp" -ForegroundColor DarkGray
} else {
    Write-Host "  No private LAN IPv4 detected" -ForegroundColor DarkGray
}
Ensure-WebEnvLocal -LanIp $lanIp

# 6. Go modules (optional)
if ((Test-Path $serverPath) -and (Test-CommandExists "go")) {
    Write-Host "`nDownloading Go module dependencies..." -ForegroundColor Yellow
    Push-Location $serverPath
    try {
        go mod download 2>$null
        Write-Host "  go mod download complete (server)" -ForegroundColor Green
    } catch {
        Write-Host "  go mod download skipped or failed" -ForegroundColor DarkYellow
    } finally {
        Pop-Location
    }
}

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start dev:  .\tools\start_app.ps1  (web + Go API + MCP)" -ForegroundColor White
Write-Host "  2. Open:       http://localhost:3000" -ForegroundColor White
Write-Host "  3. MCP URL:    http://localhost:8080/mcp  (Connect AI in TopNav)" -ForegroundColor White
if ($lanIp) {
    Write-Host "  3. LAN access: http://${lanIp}:3000 (after dev server starts)" -ForegroundColor White
}
Write-Host ""
Write-Host "Docs: docs/setup.md and docs/quickstart.md" -ForegroundColor DarkGray
Write-Host "Note: Restart the terminal if Bun or Go was just installed." -ForegroundColor Yellow

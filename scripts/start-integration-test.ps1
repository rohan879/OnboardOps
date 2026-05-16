# OnboardOps Integration Test Startup Script (PowerShell)
# Starts the backend MCP server and frontend dashboard for Phase 2 testing.

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

Write-Host "=== OnboardOps Integration Test Startup ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".bob/modes/onboard.md")) {
    Write-Host "ERROR: Must run from an OnboardOps checkout with .bob/modes/onboard.md" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Starting backend MCP server..." -ForegroundColor Green

$defaultDemoRepo = Resolve-Path (Join-Path $repoRoot "..\demo-repo") -ErrorAction SilentlyContinue
if (-not $env:ONBOARDOPS_DEMO_REPO_PATH -and $defaultDemoRepo) {
    $env:ONBOARDOPS_DEMO_REPO_PATH = $defaultDemoRepo.Path
}

if (-not $env:ONBOARDOPS_DEMO_REPO_PATH) {
    Write-Host "  ERROR: ONBOARDOPS_DEMO_REPO_PATH is not set and ../demo-repo was not found." -ForegroundColor Red
    exit 1
}

$demoRepoPath = Resolve-Path -LiteralPath $env:ONBOARDOPS_DEMO_REPO_PATH
$demoRepoPathString = $demoRepoPath.Path
Write-Host "  Demo repo: $($demoRepoPath.Path)" -ForegroundColor Gray

$gitExe = (Get-Command git.exe -ErrorAction SilentlyContinue).Source
if ($gitExe) {
    $env:GIT_PYTHON_GIT_EXECUTABLE = $gitExe
    $env:GIT_CONFIG_COUNT = "1"
    $env:GIT_CONFIG_KEY_0 = "safe.directory"
    $env:GIT_CONFIG_VALUE_0 = $demoRepoPath.Path
}

try {
    $pythonCmd = Get-Command python -ErrorAction Stop
    $pythonExe = $pythonCmd.Source
    $pythonVersion = & $pythonExe --version 2>&1
    Write-Host "  Python found: $pythonVersion" -ForegroundColor Gray
} catch {
    $bundledPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
    if (Test-Path $bundledPython) {
        $pythonExe = $bundledPython
        $pythonVersion = & $pythonExe --version 2>&1
        Write-Host "  Python found: $pythonVersion" -ForegroundColor Gray
    } else {
        Write-Host "  ERROR: Python not found. Install Python 3.11+ first." -ForegroundColor Red
        exit 1
    }
}

$venvPython = Join-Path $repoRoot "backend\.venv\Scripts\python.exe"
$venvHealthy = $false
if (Test-Path $venvPython) {
    try {
        & $venvPython --version *> $null
        $venvHealthy = ($LASTEXITCODE -eq 0)
    } catch {
        $venvHealthy = $false
    }
}

if (-not $venvHealthy) {
    if (Test-Path "backend/.venv") {
        Write-Host "  Existing virtual environment is broken; recreating..." -ForegroundColor Yellow
        Remove-Item -LiteralPath "backend/.venv" -Recurse -Force
    }
    Write-Host "  Creating Python virtual environment..." -ForegroundColor Yellow
    Push-Location backend
    & $pythonExe -m venv .venv
    Pop-Location
}

Write-Host "  Installing backend dependencies..." -ForegroundColor Yellow
Push-Location backend
& .\.venv\Scripts\Activate.ps1
pip install -q -r requirements.txt
Pop-Location

Write-Host "  Starting backend on port 8765..." -ForegroundColor Yellow
$backendPath = Join-Path $repoRoot "backend"
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:backendPath
    $env:ONBOARDOPS_DEMO_REPO_PATH = $using:demoRepoPathString
    $env:GIT_PYTHON_GIT_EXECUTABLE = $using:gitExe
    $env:GIT_CONFIG_COUNT = "1"
    $env:GIT_CONFIG_KEY_0 = "safe.directory"
    $env:GIT_CONFIG_VALUE_0 = $using:demoRepoPathString
    & .\.venv\Scripts\Activate.ps1
    python -m uvicorn app:app --host 127.0.0.1 --port 8765 --reload
}

Write-Host "  Waiting for backend to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$backendReady = $false

for ($attempt = 0; $attempt -lt $maxAttempts -and -not $backendReady; $attempt++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:8765/health" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            Write-Host "  OK: Backend ready" -ForegroundColor Green
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

if (-not $backendReady) {
    Write-Host ""
    Write-Host "  ERROR: Backend failed to start after 30 seconds" -ForegroundColor Red
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""
Write-Host "Step 2: Starting frontend dashboard..." -ForegroundColor Green

try {
    $nodeVersion = node --version 2>&1
    Write-Host "  Node found: $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Host "  ERROR: Node.js not found. Install Node.js 20+ first." -ForegroundColor Red
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    exit 1
}

if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "  Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

Write-Host "  Starting frontend on port 3000..." -ForegroundColor Yellow
$frontendPath = Join-Path $repoRoot "frontend"
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:frontendPath
    npm run dev
}

Write-Host "  Waiting for frontend to be ready..." -ForegroundColor Yellow
$frontendReady = $false

for ($attempt = 0; $attempt -lt $maxAttempts -and -not $frontendReady; $attempt++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $frontendReady = $true
            Write-Host "  OK: Frontend ready" -ForegroundColor Green
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

if (-not $frontendReady) {
    Write-Host ""
    Write-Host "  WARNING: Frontend may still be starting. Check http://localhost:3000 manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Integration Test Environment Ready ===" -ForegroundColor Cyan
Write-Host "Backend MCP Server:  http://127.0.0.1:8765" -ForegroundColor White
Write-Host "Frontend Dashboard:  http://localhost:3000" -ForegroundColor White
Write-Host "WebSocket Bridge:    ws://127.0.0.1:8765/events" -ForegroundColor White
Write-Host ""
Write-Host "Backend Job ID:  $($backendJob.Id)" -ForegroundColor Gray
Write-Host "Frontend Job ID: $($frontendJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open your demo repository in Bob IDE" -ForegroundColor White
Write-Host "2. Type /onboard in Bob chat" -ForegroundColor White
Write-Host "3. Follow docs/T1.3-QUICK-START.md" -ForegroundColor White
Write-Host ""
Write-Host "To stop services, run: .\scripts\stop-integration-test.ps1" -ForegroundColor Yellow
Write-Host ""

$backendJob.Id | Out-File -FilePath ".backend-job-id" -Encoding ASCII
$frontendJob.Id | Out-File -FilePath ".frontend-job-id" -Encoding ASCII

Write-Host "Press Ctrl+C to stop monitoring. Services will continue running in background." -ForegroundColor Gray
Write-Host ""

try {
    while ($true) {
        Start-Sleep -Seconds 5
        $backendState = (Get-Job -Id $backendJob.Id -ErrorAction SilentlyContinue).State
        $frontendState = (Get-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue).State

        if ($backendState -ne "Running") {
            Write-Host "WARNING: Backend job stopped (State: $backendState)" -ForegroundColor Red
        }

        if ($frontendState -ne "Running") {
            Write-Host "WARNING: Frontend job stopped (State: $frontendState)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host ""
    Write-Host "Monitoring stopped. Services are still running in background." -ForegroundColor Yellow
    Write-Host "Use .\scripts\stop-integration-test.ps1 to stop them." -ForegroundColor Yellow
}

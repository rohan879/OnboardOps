# OnboardOps Integration Test Shutdown Script (PowerShell)
# Stops the backend MCP server and frontend dashboard started by start-integration-test.ps1.

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

Write-Host "=== OnboardOps Integration Test Shutdown ===" -ForegroundColor Cyan
Write-Host ""

$backendJobId = $null
$frontendJobId = $null

if (Test-Path ".backend-job-id") {
    $backendJobId = (Get-Content ".backend-job-id" -Raw).Trim()
}

if (Test-Path ".frontend-job-id") {
    $frontendJobId = (Get-Content ".frontend-job-id" -Raw).Trim()
}

if ($backendJobId) {
    Write-Host "Stopping backend job (ID: $backendJobId)..." -ForegroundColor Yellow
    try {
        Stop-Job -Id $backendJobId -ErrorAction SilentlyContinue
        Remove-Job -Id $backendJobId -ErrorAction SilentlyContinue
        Write-Host "  OK: Backend job stopped" -ForegroundColor Green
    } catch {
        Write-Host "  Backend job not found; it may already be stopped" -ForegroundColor Gray
    }
    Remove-Item ".backend-job-id" -ErrorAction SilentlyContinue
}

if ($frontendJobId) {
    Write-Host "Stopping frontend job (ID: $frontendJobId)..." -ForegroundColor Yellow
    try {
        Stop-Job -Id $frontendJobId -ErrorAction SilentlyContinue
        Remove-Job -Id $frontendJobId -ErrorAction SilentlyContinue
        Write-Host "  OK: Frontend job stopped" -ForegroundColor Green
    } catch {
        Write-Host "  Frontend job not found; it may already be stopped" -ForegroundColor Gray
    }
    Remove-Item ".frontend-job-id" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Checking for processes on ports 8765 and 3000..." -ForegroundColor Yellow

$backend = Get-NetTCPConnection -LocalPort 8765 -ErrorAction SilentlyContinue
if ($backend) {
    $backendPid = $backend.OwningProcess | Select-Object -First 1
    Write-Host "  Stopping process on port 8765 (PID: $backendPid)..." -ForegroundColor Yellow
    Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
    Write-Host "  OK: Port 8765 freed" -ForegroundColor Green
} else {
    Write-Host "  Port 8765 already free" -ForegroundColor Gray
}

$frontend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($frontend) {
    $frontendPid = $frontend.OwningProcess | Select-Object -First 1
    Write-Host "  Stopping process on port 3000 (PID: $frontendPid)..." -ForegroundColor Yellow
    Stop-Process -Id $frontendPid -Force -ErrorAction SilentlyContinue
    Write-Host "  OK: Port 3000 freed" -ForegroundColor Green
} else {
    Write-Host "  Port 3000 already free" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Integration Test Environment Stopped ===" -ForegroundColor Cyan
Write-Host ""


# Maya Backend — Start All Services
# Run from maya-backend/ directory: .\run_all.ps1

$venvPython = "$PSScriptRoot\venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "ERROR: venv not found. Run this first:" -ForegroundColor Red
    Write-Host "  py -3.10 -m venv venv" -ForegroundColor Yellow
    Write-Host "  venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting Maya backend services (venv)..." -ForegroundColor Cyan

# Main FastAPI (port 8000)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; & '$venvPython' main.py" -WindowStyle Normal

Start-Sleep -Seconds 3

# Knowledge MCP Server (port 8001)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; & '$venvPython' mcp/knowledge_server.py" -WindowStyle Normal

# Patient MCP Server (port 8002)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; & '$venvPython' mcp/patient_server.py" -WindowStyle Normal

Write-Host ""
Write-Host "All services launching in separate windows." -ForegroundColor Green
Write-Host "Main API:       http://localhost:8000" -ForegroundColor Yellow
Write-Host "Knowledge MCP:  http://localhost:8001" -ForegroundColor Yellow
Write-Host "Patient MCP:    http://localhost:8002" -ForegroundColor Yellow
Write-Host "API docs:       http://localhost:8000/docs" -ForegroundColor Yellow

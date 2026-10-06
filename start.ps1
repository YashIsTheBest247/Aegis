# Aegis AI — one-shot dev launcher (Windows PowerShell)
# Starts both backend (FastAPI) and frontend (Vite) in separate windows.

Write-Host "`n Aegis AI — launching dev stack..." -ForegroundColor Yellow

# Backend
$backendCmd = "cd '$PSScriptRoot\backend'; if (-not (Test-Path .venv)) { python -m venv .venv }; .\.venv\Scripts\Activate.ps1; pip install -q -r requirements.txt; python main.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 2

# Frontend
$frontendCmd = "cd '$PSScriptRoot\frontend'; if (-not (Test-Path node_modules)) { npm install }; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "`nBackend  http://localhost:8000"
Write-Host "Frontend http://localhost:5173`n"

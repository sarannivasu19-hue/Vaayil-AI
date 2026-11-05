Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting Vaayil AI Platform (வாயில் AI)" -ForegroundColor White
Write-Host "  Tagline: Every business. One voice at the door." -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

Write-Host "`nStarting Backend FastAPI Server on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; `$env:PYTHONPATH='.'; .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "Starting Frontend Dev Server on http://127.0.0.1:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host "`nBoth processes launched!" -ForegroundColor Green
Write-Host "Frontend: http://127.0.0.1:5173" -ForegroundColor White
Write-Host "Backend:  http://127.0.0.1:8000 (Swagger: http://127.0.0.1:8000/docs)" -ForegroundColor White


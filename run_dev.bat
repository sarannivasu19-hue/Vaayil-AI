@echo off
echo ========================================================
echo   Starting Vaayil AI Platform (வாயில் AI)
echo   Tagline: Every business. One voice at the door.
echo ========================================================

echo.
echo Starting Backend API Server (FastAPI on http://127.0.0.1:8000)...
start "Vaayil AI - Backend" cmd /k "cd backend && set PYTHONPATH=. && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo Starting Frontend Client (Vite on http://127.0.0.1:5173)...
start "Vaayil AI - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching!
echo Backend:  http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)
echo Frontend: http://127.0.0.1:5173
echo.


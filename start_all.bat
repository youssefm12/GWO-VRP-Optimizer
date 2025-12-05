@echo off
echo ================================================
echo   VRP Optimizer - Grey Wolf Optimization
echo ================================================
echo.
echo Starting Backend Server...
start "VRP Backend" cmd /k "cd /d %~dp0 && venv\Scripts\activate && cd backend && python run.py"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting Frontend Development Server...
start "VRP Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ================================================
echo   Both servers are starting!
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo ================================================
echo.
echo Press any key to exit this window...
pause > nul

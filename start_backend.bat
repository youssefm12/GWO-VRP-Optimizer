@echo off
echo Starting VRP Optimizer Backend...
echo.
cd /d "%~dp0"
call venv\Scripts\activate
cd backend
python run.py

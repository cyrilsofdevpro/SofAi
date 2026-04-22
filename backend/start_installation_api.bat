@echo off
REM SofAi Installation API Launcher
REM This script starts the installation API on port 5050

setlocal enabledelayedexpansion

echo.
echo ======================================
echo  SofAi Installation API
echo ======================================
echo.

REM Get the directory where this script is located
cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from python.org
    pause
    exit /b 1
)

echo Checking Python installation...
python --version

REM Install/upgrade pip
echo.
echo Installing/updating pip...
python -m pip install --upgrade pip --quiet

REM Install Flask and CORS
echo Installing dependencies (Flask, Flask-CORS)...
python -m pip install flask flask-cors --quiet

REM Start the installation API
echo.
echo Starting Installation API on http://localhost:5050
echo Press Ctrl+C to stop
echo.

python installation_api.py

pause

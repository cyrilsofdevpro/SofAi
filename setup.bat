@echo off
REM SofAi Complete Setup Script
REM Starts both the backend installation API and frontend development server

setlocal enabledelayedexpansion

cls
echo.
echo ============================================
echo   SofAi Installation & Setup
echo ============================================
echo.
echo This script will:
echo  1. Start the Installation API (port 5050)
echo  2. Start the Frontend dev server (port 3002)
echo.
echo You'll see two windows open. Keep them both running.
echo Then open http://localhost:3002 in your browser.
echo.
pause

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from nodejs.org
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from python.org
    pause
    exit /b 1
)

cd /d "%~dp0"

echo.
echo Starting Backend Installation API...
echo.
start "SofAi Installation API" cmd /k "cd backend && start_installation_api.bat"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

echo.
echo Starting Frontend Development Server...
echo.
start "SofAi Frontend Dev Server" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo Backend (Installation API):
echo   http://localhost:5050
echo.
echo Frontend (Dev Server):
echo   http://localhost:3002
echo.
echo Open http://localhost:3002 in your browser
echo and click the install button to get started!
echo.
echo Press any key to close this window...
pause

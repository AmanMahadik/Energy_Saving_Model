@echo off
echo ===================================================
echo   Energy Saving Model - Production Runner
echo ===================================================
echo.
echo   This script runs the compiled production Web App.
echo.

:: Refresh environment PATH to include Node.js
set "PATH=%PATH%;C:\Program Files\nodejs"

:: Start the Express backend in the background
echo   [1/2] Starting backend API on port 3000...
start /b cmd /c "node backend/index.js"

:: Give the backend 2 seconds to boot
timeout /t 2 /nobreak >nul

:: Start the Python HTTP server for static files and open the browser
echo   [2/2] Starting static web server on http://localhost:5000...
echo   Opening browser...
start "" "http://localhost:5000"
py -m http.server 5000 --directory frontend/dist

pause

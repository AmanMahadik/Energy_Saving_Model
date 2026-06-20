@echo off
echo ===================================================
echo   Energy Saving Model - Local Development Runner
echo ===================================================
echo.
echo   Starting both Backend (Express) and Frontend (Expo)...
echo.

:: Refresh environment PATH to include Node.js
set "PATH=%PATH%;C:\Program Files\nodejs"

:: Run the root development script
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process; npm run dev"

pause

@echo off
echo ===================================================
echo   Energy Saving Model - Web App Builder
echo ===================================================
echo.

set /p RENDER_URL="Enter your Render backend URL (e.g. https://energy-app-api.onrender.com) or press Enter for localhost:3000: "

if "%RENDER_URL%"=="" (
    set RENDER_URL=http://localhost:3000
)

echo.
echo Building Web App with Backend API: %RENDER_URL%
echo.

:: Refresh environment PATH to include Node.js and run the build
set "PATH=%PATH%;C:\Program Files\nodejs"
set "EXPO_PUBLIC_API_URL=%RENDER_URL%"

cd frontend
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process; npm run build:web"
cd ..

echo.
echo ===================================================
echo   Build Completed!
echo ===================================================
echo   The build files are inside the folder:
echo   frontend/dist
echo.
echo   You can upload this "dist" folder directly to
echo   Netlify or Vercel for free web hosting.
echo ===================================================
echo.
pause

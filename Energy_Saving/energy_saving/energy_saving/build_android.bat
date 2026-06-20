@echo off
echo ===================================================
echo   Energy Saving Model - Android APK Builder (EAS Cloud)
echo ===================================================
echo.
echo   Note: EAS Build runs in Expo's cloud. You will need
echo   a free Expo account (https://expo.dev) to build.
echo.

set /p RENDER_URL="Enter your Render backend URL (e.g. https://energy-app-api.onrender.com) or press Enter for localhost:3000: "

if "%RENDER_URL%"=="" (
    set RENDER_URL=http://localhost:3000
)

echo.
echo Configuring environment for Android build...
set "PATH=%PATH%;C:\Program Files\nodejs"
set "EXPO_PUBLIC_API_URL=%RENDER_URL%"

cd frontend

echo.
echo Checking EAS CLI status and logging in...
echo (If you are not logged in, please follow the prompt to log in or create an account)
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process; npx eas login"

echo.
echo Starting EAS Android APK build...
echo.
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process; npx eas build -p android --profile preview"

cd ..
echo.
echo APK build process finished or sent to queue.
pause

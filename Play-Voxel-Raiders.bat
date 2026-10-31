@echo off
title Voxel Raiders - Host Server and Game Launcher
color 0A
cls
echo ===================================================================
echo               VOXEL RAIDERS: DIMENSIONAL RIFT
echo             HOST DEVICE SERVER ^& CLIENT LAUNCHER
echo ===================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js runtime...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js was not found in your PATH. Please install Node.js.
    pause
    exit /b 1
)

echo [2/3] Starting authoritative multiplayer server on this host device...
start /b "" node server/index.js > server.log 2>&1

:: Wait a brief moment for server to bind port 10000
timeout /t 2 /nobreak >nul

echo [3/3] Detecting local IP address for LAN / Wi-Fi players...
for /f "tokens=4" %%a in ('route print 0.0.0.0 ^| findstr 0.0.0.0 ^| findstr /v "0.0.0.0.*0.0.0.0"') do (
    set LOCAL_IP=%%a
)

echo.
echo ===================================================================
echo    SERVER IS NOW ACTIVE ON THIS HOST DEVICE!
echo ===================================================================
echo.
echo  * Local Player (This Machine):  http://localhost:10000
if defined LOCAL_IP (
    echo  * Other Players (Wi-Fi / LAN):  http://%LOCAL_IP%:10000
)
echo.
echo Launching game in your browser now...
start "" http://localhost:10000
echo.
echo Keep this window open while playing to allow other players to join!
echo To stop the server, press Ctrl+C or close this window.
echo.
pause

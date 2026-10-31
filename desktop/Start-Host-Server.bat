@echo off
title Voxel Raiders - Dedicated Host Server
color 0A
echo ===================================================
echo     VOXEL RAIDERS: DEDICATED HOST SERVER (PC)
echo ===================================================
echo.
echo Initializing Local LAN Beacon on UDP Port 48888...
echo Initializing Local Save Storage at %%APPDATA%%\VoxelRaiders\saves\
echo.
node server/index.js
pause

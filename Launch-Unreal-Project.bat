@echo off
title Voxel Raiders - Unreal Engine 5.8 Launcher
color 0E
echo ===================================================================
echo     LAUNCHING VOXEL RAIDERS IN UNREAL ENGINE 5.8
echo ===================================================================
echo.

set UE_PATH=C:\Program Files\Epic Games\UE_5.8\Engine\Binaries\Win64\UnrealEditor.exe
set PROJECT_PATH=%~dp0unreal_project\VoxelRaiders.uproject

if not exist "%UE_PATH%" (
    echo ERROR: Unreal Engine 5.8 was not found at "%UE_PATH%".
    pause
    exit /b 1
)

echo Opening project in Unreal Engine 5.8 Editor...
start "" "%UE_PATH%" "%PROJECT_PATH%"
echo.
echo Unreal Engine 5.8 is loading your Voxel Raiders project!
timeout /t 5

@echo off
title UMIS Startup Manager
:: Establishes the visual style for the system tool
color 0B

:: Verify PowerShell availability on the employee's system
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo ====================================================================
    echo   CRITICAL ERROR: PowerShell is required but was not found!
    echo   This system utility requires PowerShell to be installed on Windows.
    echo ====================================================================
    pause
    exit /b 1
)

:: Determine the path to the PowerShell logic script
set "PS_SCRIPT=%~dp0scripts\configure-startup.ps1"
if not exist "%PS_SCRIPT%" (
    :: Fallback: Check if this batch file was moved/run from inside the scripts folder
    set "PS_SCRIPT=%~dp0configure-startup.ps1"
)

if not exist "%PS_SCRIPT%" (
    echo ====================================================================
    echo   CRITICAL ERROR: configure-startup.ps1 was not found!
    echo   Expected at: %~dp0scripts\configure-startup.ps1
    echo   Please ensure the scripts folder is intact and contains configure-startup.ps1.
    echo ====================================================================
    pause
    exit /b 1
)

:: Execute the script in Single Threaded Apartment (STA) mode to enable Windows GUI File Browsers,
:: bypassing execution policies safely for this local startup utility
powershell -NoProfile -ExecutionPolicy Bypass -STA -File "%PS_SCRIPT%"

exit /b 0

# build-production.ps1
# Automates the process of building the Next.js frontend, staging the static assets
# into the Django backend core folder, and compiling production packages.

$ErrorActionPreference = "Stop"
$ProjectRoot = (Get-Item -Path ".\").FullName

function Show-Menu {
    Clear-Host
    Write-Host "====================================================================" -ForegroundColor Cyan
    Write-Host "      UMIS - PRODUCTION BUILD AND STATIC ASSET STAGING PIPELINE" -ForegroundColor Cyan
    Write-Host "====================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This tool automates the process of building the Next.js frontend,"
    Write-Host "staging the static assets into the Django backend core folder, and"
    Write-Host "compiling the final production packages (EXE or Wheel)."
    Write-Host ""
    Write-Host "Select build option:"
    Write-Host " [1] Step 1: Build & Stage Frontend Only (Next.js -> Django)"
    Write-Host " [2] Step 2: Build Standalone Windows Executable (UMIS.exe)"
    Write-Host " [3] Step 2: Build Universal Python Wheel (.whl)"
    Write-Host " [4] Exit"
    Write-Host ""
    
    $Choice = Read-Host "Choose option [1-4]"
    
    switch ($Choice) {
        "1" { Build-Frontend }
        "2" { Build-Exe }
        "3" { Build-Wheel }
        "4" { exit }
        default { Show-Menu }
    }
}

function Build-Frontend {
    Write-Host "`n====================================================================" -ForegroundColor Yellow
    Write-Host " [1/2] COMPILING NEXT.JS FRONTEND (npm run build)" -ForegroundColor Yellow
    Write-Host "====================================================================`n" -ForegroundColor Yellow

    if (-not (Test-Path "src\frontend\package.json")) {
        Write-Host "[!] Error: Cannot find src\frontend\package.json." -ForegroundColor Red
        Write-Host "    Ensure you are running this from the UMIS project root directory." -ForegroundColor Red
        pause
        Show-Menu
        return
    }

    Set-Location "src\frontend"
    npm install
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n[!] Error: Next.js compilation failed. Staging aborted." -ForegroundColor Red
        Set-Location $ProjectRoot
        pause
        Show-Menu
        return
    }

    Set-Location $ProjectRoot

    Write-Host "`n====================================================================" -ForegroundColor Yellow
    Write-Host " [2/2] STAGING STATIC ASSETS INTO DJANGO (src/backend/core)" -ForegroundColor Yellow
    Write-Host "====================================================================`n" -ForegroundColor Yellow

    if (-not (Test-Path "src\backend\core\static")) { New-Item -ItemType Directory -Path "src\backend\core\static" | Out-Null }
    if (-not (Test-Path "src\backend\core\templates")) { New-Item -ItemType Directory -Path "src\backend\core\templates" | Out-Null }

    Write-Host "[*] Cleaning old static assets in Django..."
    if (Test-Path "src\backend\core\templates\index.html") { Remove-Item "src\backend\core\templates\index.html" -Force }
    if (Test-Path "src\backend\core\static\_next") { Remove-Item "src\backend\core\static\_next" -Recurse -Force }
    if (Test-Path "src\backend\core\static\favicon.ico") { Remove-Item "src\backend\core\static\favicon.ico" -Force }

    Write-Host "[*] Copying index.html to templates..."
    Copy-Item "src\frontend\out\index.html" "src\backend\core\templates\index.html" -Force

    Write-Host "[*] Staging static assets recursively..."
    Copy-Item "src\frontend\out\*" "src\backend\core\static\" -Recurse -Exclude "index.html" -Force

    Write-Host "`n[+] SUCCESS: Frontend static assets successfully built and staged inside Django!" -ForegroundColor Green
    Write-Host "    - Templates: src/backend/core/templates/index.html" -ForegroundColor Green
    Write-Host "    - Assets:    src/backend/core/static/ (including _next/ static chunks)`n" -ForegroundColor Green
    
    pause
    Show-Menu
}

function Build-Exe {
    Write-Host "Not implemented in PS1 yet. Please use GitHub Actions." -ForegroundColor Red
    pause
    Show-Menu
}

function Build-Wheel {
    Write-Host "Not implemented in PS1 yet. Please use GitHub Actions." -ForegroundColor Red
    pause
    Show-Menu
}

Show-Menu

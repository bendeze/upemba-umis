# configure-startup.ps1
# Interactive Startup Manager for Upemba Medical Information System (UMIS)
# Establishes automatic background execution of UMIS on employee machine boot.

# Add required .NET assemblies for file browsing dialogs
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$StartupFolder = [System.Environment]::GetFolderPath('Startup')
$UmisDir = Join-Path $env:USERPROFILE ".umis"
$LnkPath = Join-Path $StartupFolder "UMIS.lnk"
$VbsPath = Join-Path $UmisDir "umis-launcher.vbs"

# Styling Palette (Cyan theme matching UMIS visual language)
$Cyan = "Cyan"
$Gray = "Gray"
$White = "White"
$Green = "Green"
$Yellow = "Yellow"
$Red = "DarkRed"

function Write-Header {
    Clear-Host
    Write-Host "======================================================================" -ForegroundColor $Cyan
    Write-Host "       UMIS - UPEMBA MEDICAL INFORMATION SYSTEM STARTUP MANAGER       " -ForegroundColor $Cyan -BackgroundColor Black
    Write-Host "======================================================================" -ForegroundColor $Cyan
    Write-Host ""
}

function Show-Footer {
    Write-Host ""
    Write-Host "----------------------------------------------------------------------" -ForegroundColor $Gray
    Write-Host " Press any key to return to the main menu..." -ForegroundColor $Gray
    [void]$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Test-CommandExists {
    param([string]$cmd)
    $oldErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    $exists = (Get-Command $cmd) -ne $null
    $ErrorActionPreference = $oldErrorAction
    return $exists
}

function Search-Executable {
    # 1. Search in current script path
    $localExe = Join-Path $PSScriptRoot "UMIS.exe"
    if (Test-Path $localExe) { return $localExe }

    # 2. Search in parent directory
    $parentExe = Join-Path (Split-Path $PSScriptRoot -Parent) "UMIS.exe"
    if (Test-Path $parentExe) { return $parentExe }

    # 3. Search in standard release dist folder relative to repo structure
    $distExe = Join-Path (Split-Path $PSScriptRoot -Parent) "src\backend\dist\UMIS.exe"
    if (Test-Path $distExe) { return $distExe }

    # 4. Search in nested local backend dist
    $nestedDistExe = Join-Path $PSScriptRoot "src\backend\dist\UMIS.exe"
    if (Test-Path $nestedDistExe) { return $nestedDistExe }

    return $null
}

function Get-ExeFromUser {
    Write-Host "[*] Prompting File Dialog to locate UMIS.exe..." -ForegroundColor $Cyan
    
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Filter = "UMIS Executable (UMIS.exe)|UMIS.exe|All Executables (*.exe)|*.exe"
    $dialog.Title = "Locate UMIS.exe Standalone Application"
    $dialog.InitialDirectory = $PSScriptRoot
    
    $result = $dialog.ShowDialog()
    if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
        return $dialog.FileName
    }
    return $null
}

function Clean-Startup {
    $removed = $false
    if (Test-Path $LnkPath) {
        Remove-Item $LnkPath -Force
        $removed = $true
    }
    if (Test-Path $VbsPath) {
        Remove-Item $VbsPath -Force
        $removed = $true
    }
    return $removed
}

function Configure-ExeStartup {
    Write-Header
    Write-Host "--- Configuring Standalone Executable (UMIS.exe) Startup ---" -ForegroundColor $White
    Write-Host ""

    # Locate executable
    $exePath = Search-Executable
    if ($null -eq $exePath) {
        Write-Host "[-] Could not automatically find UMIS.exe in common locations." -ForegroundColor $Yellow
        Write-Host "[?] Would you like to locate it manually using a Windows File Browser? (Y/N)" -NoNewline
        $ans = Read-Host
        if ($ans -like "y*" -or $ans -like "Y*") {
            $exePath = Get-ExeFromUser
        }
    }

    if ($null -eq $exePath -or !(Test-Path $exePath)) {
        Write-Host ""
        Write-Host "[!] Error: UMIS.exe could not be located. Startup configuration aborted." -ForegroundColor $Red
        Show-Footer
        return
    }

    Write-Host ""
    Write-Host "[+] Successfully located executable:" -ForegroundColor $Green
    Write-Host "    $exePath" -ForegroundColor $White
    Write-Host ""

    # Select Launch Mode
    Write-Host "Select Startup Window Style for the employee:" -ForegroundColor $Cyan
    Write-Host " [1] Hidden (Background)  - Recommended. UMIS launches completely silent in background."
    Write-Host " [2] Minimized            - Runs minimized in the taskbar."
    Write-Host " [3] Normal Window        - Opens a visible Command Prompt window."
    Write-Host ""
    Write-Host "Select [1-3]: " -NoNewline
    $styleChoice = Read-Host

    $style = 1 # Normal
    $runHidden = $false

    switch ($styleChoice) {
        "1" { $runHidden = $true }
        "2" { $style = 7 } # Minimized
        "3" { $style = 1 } # Normal
        Default { $runHidden = $true }
    }

    # Clean old ones first
    $null = Clean-Startup

    # Setup directories
    if (!(Test-Path $UmisDir)) {
        New-Item -ItemType Directory -Path $UmisDir -Force | Out-Null
    }

    if ($runHidden) {
        # Generate VBScript background launcher
        $exeDir = Split-Path $exePath
        $vbsCode = 'Set sh = CreateObject("Wscript.Shell")' + "`r`n"
        $vbsCode += 'sh.CurrentDirectory = "' + $exeDir + '"' + "`r`n"
        $vbsCode += 'sh.Run """' + $exePath + '""", 0, False'
        Set-Content -Path $VbsPath -Value $vbsCode -Encoding UTF8
        
        # Shortcut points to VBScript launcher
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($LnkPath)
        $Shortcut.TargetPath = "wscript.exe"
        $Shortcut.Arguments = "`"$VbsPath`""
        $Shortcut.WorkingDirectory = $exeDir
        $Shortcut.WindowStyle = 7
        $Shortcut.IconLocation = "$exePath,0"
        $Shortcut.Save()
    } else {
        # Shortcut points directly to executable
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($LnkPath)
        $Shortcut.TargetPath = $exePath
        $Shortcut.WorkingDirectory = Split-Path $exePath
        $Shortcut.WindowStyle = $style
        $Shortcut.Save()
    }

    Write-Host ""
    Write-Host "[+] Startup entry successfully created!" -ForegroundColor $Green
    Write-Host "    Shortcut Path:  $LnkPath" -ForegroundColor $White
    if ($runHidden) {
        Write-Host "    Launcher Path:  $VbsPath (Hidden Mode Active)" -ForegroundColor $White
    } else {
        Write-Host "    Launch Style:   " + ($ifMin = if ($style -eq 7) {"Minimized"} else {"Normal"}) -ForegroundColor $White
    }
    Write-Host ""
    Write-Host "(*) UMIS will boot automatically on next machine startup/login." -ForegroundColor $Cyan
    Show-Footer
}

function Configure-WheelStartup {
    Write-Header
    Write-Host "--- Configuring Python Wheel (umis-start) Startup ---" -ForegroundColor $White
    Write-Host ""

    # Check for Python and umis-start command
    $hasPython = Test-CommandExists "python" -or Test-CommandExists "py"
    $hasUmisStart = Test-CommandExists "umis-start"

    if (!$hasPython) {
        Write-Host "[!] Warning: Python was not detected on this machine's PATH." -ForegroundColor $Yellow
        Write-Host "    Please ensure Python is installed and added to the environment variables." -ForegroundColor $Gray
    }

    Write-Host "Please select how you want to launch the installed Wheel package:" -ForegroundColor $Cyan
    Write-Host " [1] via 'umis-start' global entrypoint command (Recommended)"
    Write-Host " [2] via 'py -m cli' module command in source directory"
    Write-Host ""
    Write-Host "Select [1-2]: " -NoNewline
    $launchChoice = Read-Host

    $target = ""
    $args = ""
    $workingDir = ""

    if ($launchChoice -eq "2") {
        # Need source directory
        Write-Host ""
        Write-Host "Please drag-and-drop or enter the path to the UMIS backend source directory (containing cli.py):" -ForegroundColor $Cyan
        $sourceDir = Read-Host
        $sourceDir = $sourceDir -replace '^["'']', '' -replace '["'']$', '' # Strip quotes

        if (!(Test-Path $sourceDir) -or !(Test-Path (Join-Path $sourceDir "cli.py"))) {
            Write-Host "[!] Error: Invalid source directory or cli.py not found in path." -ForegroundColor $Red
            Show-Footer
            return
        }
        $target = "py"
        $args = "-m cli"
        $workingDir = $sourceDir
    } else {
        # Check if they want to override the path or use the default umis-start wrapper
        $target = "cmd.exe"
        $args = "/c umis-start"
        $workingDir = $env:USERPROFILE
    }

    # Select Launch Mode
    Write-Host ""
    Write-Host "Select Startup Window Style for the employee:" -ForegroundColor $Cyan
    Write-Host " [1] Hidden (Background)  - Recommended. UMIS launches completely silent in background."
    Write-Host " [2] Minimized            - Runs minimized in the taskbar."
    Write-Host " [3] Normal Window        - Opens a visible Command Prompt window."
    Write-Host ""
    Write-Host "Select [1-3]: " -NoNewline
    $styleChoice = Read-Host

    $style = 1 # Normal
    $runHidden = $false

    switch ($styleChoice) {
        "1" { $runHidden = $true }
        "2" { $style = 7 }
        "3" { $style = 1 }
        Default { $runHidden = $true }
    }

    # Clean old ones first
    $null = Clean-Startup

    # Setup directories
    if (!(Test-Path $UmisDir)) {
        New-Item -ItemType Directory -Path $UmisDir -Force | Out-Null
    }

    if ($runHidden) {
        # Generate VBScript background launcher
        $launchCmd = ""
        if ($launchChoice -eq "2") {
            $launchCmd = "cmd.exe /c py -m cli"
        } else {
            $launchCmd = "cmd.exe /c umis-start"
        }

        $vbsCode = 'Set sh = CreateObject("Wscript.Shell")' + "`r`n"
        if ($workingDir) {
            $vbsCode += 'sh.CurrentDirectory = "' + $workingDir + '"' + "`r`n"
        }
        $vbsCode += 'sh.Run "' + $launchCmd + '", 0, False'
        Set-Content -Path $VbsPath -Value $vbsCode -Encoding UTF8
        
        # Shortcut points to VBScript launcher
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($LnkPath)
        $Shortcut.TargetPath = "wscript.exe"
        $Shortcut.Arguments = "`"$VbsPath`""
        if ($workingDir) { $Shortcut.WorkingDirectory = $workingDir }
        $Shortcut.WindowStyle = 7
        $Shortcut.Save()
    } else {
        # Direct Shortcut
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($LnkPath)
        
        if ($launchChoice -eq "2") {
            $Shortcut.TargetPath = "py.exe"
            $Shortcut.Arguments = "-m cli"
        } else {
            $Shortcut.TargetPath = "cmd.exe"
            $Shortcut.Arguments = "/c umis-start"
        }
        
        if ($workingDir) { $Shortcut.WorkingDirectory = $workingDir }
        $Shortcut.WindowStyle = $style
        $Shortcut.Save()
    }

    Write-Host ""
    Write-Host "[+] Startup entry successfully created for Wheel!" -ForegroundColor $Green
    Write-Host "    Shortcut Path:  $LnkPath" -ForegroundColor $White
    if ($runHidden) {
        Write-Host "    Launcher Path:  $VbsPath (Hidden Mode Active)" -ForegroundColor $White
    }
    Write-Host ""
    Write-Host "(*) UMIS will boot automatically on next machine startup/login." -ForegroundColor $Cyan
    Show-Footer
}

function Remove-StartupConfig {
    Write-Header
    Write-Host "--- Removing UMIS Startup Configuration ---" -ForegroundColor $White
    Write-Host ""
    
    $removed = Clean-Startup
    
    if ($removed) {
        Write-Host "[+] UMIS successfully removed from startup." -ForegroundColor $Green
        Write-Host "    Startup shortcut and background scripts have been cleared." -ForegroundColor $White
    } else {
        Write-Host "[*] No active UMIS startup configuration was found." -ForegroundColor $Yellow
    }
    
    Show-Footer
}

# --- Main Program Loop ---
do {
    Write-Header
    Write-Host "Select the installation type on this machine:" -ForegroundColor $Cyan
    Write-Host " [1] Standalone Executable (UMIS.exe) - Most Common" -ForegroundColor $White
    Write-Host " [2] Python Universal Wheel (umis-start / pip installed)" -ForegroundColor $White
    Write-Host " [3] Remove UMIS from Startup" -ForegroundColor $Yellow
    Write-Host " [4] Exit" -ForegroundColor $White
    Write-Host ""
    Write-Host "Choose option [1-4]: " -NoNewline
    $choice = Read-Host
    
    switch ($choice) {
        "1" { Configure-ExeStartup }
        "2" { Configure-WheelStartup }
        "3" { Remove-StartupConfig }
        "4" { $running = $false }
    }
} while ($choice -ne "4")

Write-Host "Startup Manager closed." -ForegroundColor $Gray

# UMIS Utility Scripts

This folder contains utility scripts for managing the Upemba Medical Information System (UMIS).

## Available Scripts

### `install-umis.ps1`
The **Automated 1-Click Installer**. This is the primary script used by employees to install UMIS on their local Windows machines. It handles Python installation, downloading the `.whl` package from GitHub, and configuring startup behavior.

### `configure-startup.ps1`
A legacy interactive script for configuring the `.vbs` hidden launcher and `.lnk` shortcuts for the Start Menu and Desktop. (This logic is now fully integrated and automated inside `install-umis.ps1`, but this script is preserved for manual debugging and specialized configurations).

### `build-production.ps1`
A local development script used to compile the Next.js frontend into static assets and stage them directly into the Django backend's `core/` application. This is useful for testing the production compilation locally before pushing to GitHub Actions.

## How to Run

To run any of these scripts, open PowerShell as Administrator and execute them:

```powershell
# Example: Running the build pipeline
.\build-production.ps1
```

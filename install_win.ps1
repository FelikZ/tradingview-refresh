#Requires -Version 5.1

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Self-elevate to admin if not already running elevated
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

$ErrorActionPreference = "Stop"

$InstallDir = "C:\Program Files\TradingViewRefresh"

Write-Host "=== TradingView Refresh Installer ===" -ForegroundColor Cyan
Write-Host ""

# Build the Go binary if not running from a pre-built release package
if (-not (Test-Path "$ScriptDir\tradingview-refresh.exe")) {
    Write-Host "Building tradingview-refresh.exe..." -ForegroundColor Yellow
    $env:GOARCH = "amd64"
    $env:GOOS = "windows"
    Push-Location $ScriptDir
    try {
        & go build -o "$ScriptDir\tradingview-refresh.exe" .
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Go build failed." -ForegroundColor Red
            pause
            exit 1
        }
    } finally {
        Pop-Location
    }
    Write-Host "Build successful." -ForegroundColor Green
} else {
    Write-Host "Found pre-built tradingview-refresh.exe, skipping build step." -ForegroundColor Green
}

# Create install directory
Write-Host "Creating install directory: $InstallDir" -ForegroundColor Yellow
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

# Copy files
Write-Host "Copying files..." -ForegroundColor Yellow
Copy-Item -Path "$ScriptDir\tradingview-refresh.exe" -Destination "$InstallDir\tradingview-refresh.exe" -Force
Copy-Item -Path "$ScriptDir\launchers\tradingview-refresh.ps1" -Destination "$InstallDir\tradingview-refresh.ps1" -Force
Copy-Item -Path "$ScriptDir\js" -Destination "$InstallDir\js" -Recurse -Force
Write-Host "Files copied." -ForegroundColor Green

# Create (or overwrite) Desktop shortcut
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "TradingView Refresh.lnk"
if (Test-Path $ShortcutPath) {
    Write-Host "Overwriting existing Desktop shortcut..." -ForegroundColor Yellow
} else {
    Write-Host "Creating Desktop shortcut..." -ForegroundColor Yellow
}

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$InstallDir\tradingview-refresh.ps1`""
$Shortcut.WorkingDirectory = $InstallDir
$Shortcut.Description = "TradingView Refresh - Extend TradingView alerts"
$Shortcut.Save()
Write-Host "Shortcut ready: $ShortcutPath" -ForegroundColor Green

# Clean up build artifact from source directory
Remove-Item -Path "$ScriptDir\tradingview-refresh.exe" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Installation complete ===" -ForegroundColor Cyan
Write-Host "You can now use the 'TradingView Refresh' shortcut on your Desktop."
Write-Host ""
pause

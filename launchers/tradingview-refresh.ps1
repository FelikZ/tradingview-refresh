# create shortcut with the following:
# powershell.exe -ExecutionPolicy Bypass -File "C:\Program Files\TradingViewRefresh\tradingview-refresh.ps1"
# Update Icon and Pin to Taskbar if needed
$env:TV_DIR = (Get-AppxPackage | Where-Object { $_.Name -like "*TradingView*" } | Select-Object -ExpandProperty InstallLocation)

$process = Get-Process | Where-Object { $_.Name -eq [System.IO.Path]::GetFileNameWithoutExtension("TradingView.exe") }

# Stop the process if it is running
$process | Stop-Process

# Wait for the process to exit
while ($process) {
    Start-Sleep -Milliseconds 100
    $process = Get-Process | Where-Object { $_.Id -eq $process.Id } -ErrorAction SilentlyContinue
} 

& "$PSScriptRoot/tradingview-refresh.exe" -p 9222 -app "$env:TV_DIR\TradingView.exe" 2>&1

echo "This window will close in 10 seconds"
Start-Sleep -Seconds 10
# create shortcut with the following:
# powershell.exe -ExecutionPolicy Bypass -File "C:\Program Files\TradingViewRefresh\tradingview-refresh.ps1"
# Update Icon and Pin to Taskbar if needed

Write-Host "=== TradingView Refresh ===" -ForegroundColor Cyan
Write-Host ""

$env:TV_DIR = (Get-AppxPackage | Where-Object { $_.Name -like "*TradingView*" } | Select-Object -ExpandProperty InstallLocation)

if (-not $env:TV_DIR) {
    Write-Host "TradingView app not found." -ForegroundColor Red
    Start-Sleep -Seconds 10
    exit 1
}

$process = Get-Process | Where-Object { $_.Name -eq [System.IO.Path]::GetFileNameWithoutExtension("TradingView.exe") }

# Stop the process if it is running
if ($process) {
    Write-Host "Terminating TradingView..." -ForegroundColor Yellow
    $process | Stop-Process
    while ($process) {
        Start-Sleep -Milliseconds 100
        $process = Get-Process | Where-Object { $_.Id -eq $process.Id } -ErrorAction SilentlyContinue
    }
    Write-Host "TradingView terminated." -ForegroundColor Green
}

# Run the refresh binary and capture output
$output = & "$PSScriptRoot/tradingview-refresh.exe" -p 9222 -app "$env:TV_DIR\TradingView.exe" 2>&1
Write-Host $output

# Determine notification message
if ($output -match "No alerts needs to be extended") {
    $notification = "No alerts updated"
} else {
    $lines = ($output | Measure-Object -Line).Lines
    $notification = "$lines alerts updated"
}

# Show Windows toast notification
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime] | Out-Null

$template = @"
<toast>
    <visual>
        <binding template="ToastGeneric">
            <text>TradingView Refresh</text>
            <text>$notification</text>
        </binding>
    </visual>
</toast>
"@
try {
    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml($template)
    $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("TradingView Refresh").Show($toast)
} catch {
    Write-Host "Note: Could not show toast notification." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "=== Completed ===" -ForegroundColor Cyan

# Countdown and auto-close
for ($i = 30; $i -ge 1; $i--) {
    Write-Host -NoNewline "`rClosing in $i seconds... "
    Start-Sleep -Seconds 1
}

# Close the window
exit
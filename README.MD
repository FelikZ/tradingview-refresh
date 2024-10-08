This program is intended to extend existing TradingView alerts on Desktop app startup.

It excludes alerts that are have created and living withing "today" to avoid day-trading alerts.

It extends +60 days all alerts which expiring date is less then 59 days away from today.

## Mac

```bash
GOARCH=arm64 GOOS=darwin go build -o ./launchers/TradingViewRefresh.app/Contents/MacOS/tradingview-refresh

# Copy ./launchers/TradingViewRefresh.app to /Applications/ dir
open ./launchers
open /Applications
```

## Windows

```powershell
# build executable
go build -o tradingview-refresh.exe
# Create a directory
C:\Program Files\TradingViewRefresh

# Copy both executable AND ./launchers/tradingview-refresh.ps1 to that dir

# Create a shortcut on Desktop->New->Shortcut
powershell.exe -File "C:\Program Files\TradingViewRefresh\tradingview-refresh.ps1"
# Optionally pin to 
```

## Debug TradingView (Mac)

```bash
# will inject scripts to tradingview
pip install electron-inject

# launch debugger in browser
python -m electron_inject -s -b - /Applications/TradingView.app/Contents/MacOS/TradingView --remote-allow-origins='http://localhost:*'
```
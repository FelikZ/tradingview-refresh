This program is intended to extend existing TradingView alerts on Desktop app startup.

It excludes alerts that are have created and living withing "today" to avoid day-trading alerts.

It extends +60 days all alerts which expiring date is less then 59 days away from today.

## Mac

```bash
./install_macos.sh
```

## Windows

```powershell
# build executable
go build -o tradingview-refresh.exe
# Create a directory
C:\Program Files\TradingViewRefresh

# Copy js files to that dir
# Copy both executable AND ./launchers/tradingview-refresh.ps1 to that dir

# Create a shortcut on Desktop->New->Shortcut
powershell.exe -File "C:\Program Files\TradingViewRefresh\tradingview-refresh.ps1"
# Optionally pin to 
```


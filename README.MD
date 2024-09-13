The goal is to have alerts to auto refreshed.

## Debug TradingView (Mac)

```bash
# will inject scripts to tradingview
pip install electron-inject

# launch debugger in browser
python -m electron_inject -s -b - /Applications/TradingView.app/Contents/MacOS/TradingView --remote-allow-origins='http://localhost:*'
```

## Mac

```bash
go build -o tradingview-refresh
./tradingview-refresh -p 9222 -app /Applications/TradingView.app/Contents/MacOS/TradingView
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
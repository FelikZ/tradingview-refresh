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
go build -o electron-debugger
./electron-debugger -p 9222 -app /Applications/TradingView.app/Contents/MacOS/TradingView
```

## Windows

```powershell
# you can find TradingView.exe path through task manager (CTRL+SHIFT+ESC) and the properties
go build -o electron-debugger.exe
./electron-debugger.exe -p 9222 -app "C:\Program Files\WindowsApps\TradingView.Desktop_2.9.2.6491_x64__n534cwy3pjxzj\TradingView.exe"
```
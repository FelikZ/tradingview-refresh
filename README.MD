The goal is to have alerts to auto refreshed.

```bash
# will inject scripts to tradingview
pip install electron-inject

# launch debugger in browser
python -m electron_inject -s -b - /Applications/TradingView.app/Contents/MacOS/TradingView --remote-allow-origins='http://localhost:*'
```

Go program.

```bash
go get github.com/gorilla/websocket

go build -o electron-debugger
./electron-debugger -p 9222 -app /Applications/TradingView.app/Contents/MacOS/TradingView
```
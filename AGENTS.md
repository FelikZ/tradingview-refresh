# Facts about the app

- `main.go` is the APP or the main app
- `launchers/TradingViewRefresh.app/Contents/MacOS/TradingViewRefresh` is a launcher script that starts binary executable, which starts TradingView the official executable (external) and then runs the main app logic against the official executable

TradingView is an Electron app, the main app launches it with remote debugging enabled via `--remote-debugging-port` flag.
The javascript is executed against the main window of the TradingView official app.

# Block detector script
`js/03_block_detector.js`

Block detector script finds blocks that are appear and then executes actions, in the loop (every INTERVAL_MS).

The blocks once detected, have appended new attribute `twr_block="1"` to the detected onces, to prevent actions from being executed twice.

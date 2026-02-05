#!/usr/bin/env bash

GOARCH=arm64 GOOS=darwin go build -o ./launchers/TradingViewRefresh.app/Contents/MacOS/tradingview-refresh

cp -r ./js/ ./launchers/TradingViewRefresh.app/js/
cp -r ./launchers/TradingViewRefresh.app/ /Applications/TradingViewRefresh.app/

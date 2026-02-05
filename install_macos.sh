#!/usr/bin/env bash

GOARCH=arm64 GOOS=darwin go build -o ./launchers/TradingViewRefresh.app/Contents/MacOS/tradingview-refresh

cp -r ./launchers/TradingViewRefresh.app/ /Applications/TradingViewRefresh.app/
cp -r ./js/ /Applications/TradingViewRefresh.app/Contents/MacOS/js/

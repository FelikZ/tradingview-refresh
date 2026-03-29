This program is intended to extend existing TradingView alerts on Desktop app startup.

It excludes alerts that are have created and living withing "today" to avoid day-trading alerts.

It extends +60 days all alerts which expiring date is less then 59 days away from today.


## Bonus
It extends all alerts withing "Forecast Math" block to show annual growth rates.

It makes Annual tab active by default, instead of Quarterly.

## Mac

### Using Homebrew (Recommended)

```bash
brew tap FelikZ/tradingview-refresh https://github.com/FelikZ/tradingview-refresh
brew install --cask tradingview-refresh
```

*To upgrade via Homebrew:*
```bash
brew update && brew upgrade --cask tradingview-refresh
```

### Manual Install from Source

```bash
./install_macos.sh
```

## Windows

### Using Pre-built Release
Download `TradingViewRefresh-Windows.zip` from the latest [Release](https://github.com/FelikZ/tradingview-refresh/releases), extract it, and run the `install_win.ps1` script inside.

### Manual Install from Source

```powershell
.\install_win.ps1
```


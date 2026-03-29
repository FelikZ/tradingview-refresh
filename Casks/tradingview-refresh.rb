cask "tradingview-refresh" do
  version "0.1"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000"

  url "https://github.com/FelikZ/tradingview-refresh/releases/download/v#{version}/TradingViewRefresh-macOS.zip"
  name "TradingView Refresh"
  desc "Extends TradingView alerts on Desktop app startup"
  homepage "https://github.com/FelikZ/tradingview-refresh"

  app "TradingViewRefresh.app"

  zap trash: [
    "~/Library/Application Support/TradingViewRefresh",
  ]
end

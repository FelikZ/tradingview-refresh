cask "tradingview-refresh" do
  version "0.2"
  sha256 "7f666f3ecc11606c519e1e6b71e7f41f2b62b552764ab709cba1c98371d58495"

  url "https://github.com/FelikZ/tradingview-refresh/releases/download/v#{version}/TradingViewRefresh-macOS.zip"
  name "TradingView Refresh"
  desc "Extends TradingView alerts on Desktop app startup"
  homepage "https://github.com/FelikZ/tradingview-refresh"

  app "TradingViewRefresh.app"

  zap trash: [
    "~/Library/Application Support/TradingViewRefresh",
  ]

  caveats <<~EOS
    Because this application is not signed with an Apple Developer ID, macOS Gatekeeper will show a malware warning.
    
    To bypass Gatekeeper and allow the app to run, execute the following command in your terminal after installation:
      xattr -cr /Applications/TradingViewRefresh.app
      
    Or, you can open Finder, navigate to Applications, Control-click (or Right-click) TradingView Refresh, and select "Open".
  EOS
end

{
  module: "MMM-ElPriceAnalogClock",
  position: "top_right",
  config: {
    region: "SE4",
    useAI: true,
    aiProvider: "gemini",
    apiKey: "your-api-key",
    aiPrompt: "Summarize the prices clearly in under 3 lines of advice.",
    updateInterval: 3600000,
    clockSize: 300,
    ringThickness: 20
  }
}
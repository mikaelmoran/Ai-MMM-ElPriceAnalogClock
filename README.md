# MMM-ElPriceAnalogClock

An advanced MagicMirror² module that visualizes hourly electricity prices in Sweden with a 24-hour analog ring clock. It optionally uses AI (OpenAI or Google Gemini) to analyze and summarize the best hours for using power-intensive appliances such as dishwashers, EV charging, and laundry machines.

---

## ✨ Features

- Visual 24-hour color-coded clock ring (using conic-gradient)
- Highlights current hour, minimum and maximum prices
- Displays AI-generated insights and suggestions (optional)
- Supports both OpenAI and Google Gemini
- Fully configurable thresholds and AI prompts
- English UI and config-ready for international users

---

## 📦 Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/YOUR_USERNAME/MMM-ElPriceAnalogClock.git
cd MMM-ElPriceAnalogClock
npm install
```

---

## ⚙️ Configuration

Add to your `config.js`:

```js
{
  module: "MMM-ElPriceAnalogClock",
  position: "top_right",
  config: {
    region: "SE3",                  // SE1–SE4
    useAI: true,                    // Set to true to enable AI summaries
    aiProvider: "gemini",           // "openai" or "gemini"
    apiKey: "your-api-key-here",    // Gemini or OpenAI key
    aiPrompt: "Summarize the prices in under 4 lines of text.",
    updateInterval: 3600000,        // in milliseconds (default: 1 hour)
    clockSize: 300,                 // in pixels
    ringThickness: 20               // ring thickness in pixels
  }
}
```

---

## 🧠 AI Configuration

| Option      | Description                                 |
|-------------|---------------------------------------------|
| `useAI`     | Enables or disables AI processing            |
| `aiProvider`| `"openai"` or `"gemini"`                    |
| `apiKey`    | Your API key for the selected provider       |
| `aiPrompt`  | Custom prompt for AI (optional but powerful) |

---

## 🌍 API Data Source

All price data is fetched from:

📡 [https://www.elprisetjustnu.se](https://www.elprisetjustnu.se)

---

## 🖼 Screenshots

_Add screenshots to show your awesome clock!_

---

## ❓ Support

Open issues or pull requests on GitHub.

---

## 📃 License

MIT License
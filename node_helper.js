
const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
  start() {
    console.log("[MMM-ElPrisAnalogClock] ✅ Node helper startad.");
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "GET_ELPRIS") {
      this.fetchData(payload);
    }
  },

  async fetchData(payload) {
    const { apiEndpoint, region, useAI, apiKey, aiProvider } = payload;
    const today = new Date();
    const year = today.getFullYear();
    const month = ("0" + (today.getMonth() + 1)).slice(-2);
    const day = ("0" + today.getDate()).slice(-2);
    const url = `${apiEndpoint}${year}/${month}-${day}_${region}.json`;

    console.log("[MMM-ElPrisAnalogClock] 🌐 Hämtar elpris från:", url);

    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log("[MMM-ElPrisAnalogClock] 📬 API-svar mottaget.");

      let analysis = null;
      if (useAI && apiKey && aiProvider) {
        console.log(`[MMM-ElPrisAnalogClock] 🧠 Försöker hämta AI-analys från ${aiProvider}...`);
        analysis = await this.getAIAnalysis(data, apiKey, aiProvider);
      }

      this.sendSocketNotification("ELPRIS_RESULT", {
        prices: data,
        analysis: analysis
      });
    } catch (err) {
      console.error("[MMM-ElPrisAnalogClock] ❌ Fel vid hämtning:", err);
    }
  },

  async getAIAnalysis(data, apiKey, aiProvider) {
    const prices = data
      .slice(0, 24)
      .map((d) => d.SEK_per_kWh)
      .filter((p) => typeof p === "number")
      .map((p) => p.toFixed(5))
      .join(", ");

    const prompt = `Du är en energirådgivare. Analysera följande elpriser per timme i 00-23, kr/kWh: ${prices}. Vilka tider är mest lämpliga att använda hushållsapparater som tvättmaskin,torktummlare mm.  eller laddning? Om man måste tvätta endå mellan 06-21, vilka tider skulle då passa bäst? Gör en proffsig sammanställning, Svara med max 4 rader text. Varje rad får vara max 60 tecken`;

    if (aiProvider === "gemini") {
      const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const result = await res.json();
      console.log("[MMM-ElPrisAnalogClock] 📥 Gemini-svar:", JSON.stringify(result, null, 2));
      return result?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    } else if (aiProvider === "openai") {
      const openaiUrl = "https://api.openai.com/v1/chat/completions";
      const res = await fetch(openaiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "Du är en svensk energiexpert." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7
        })
      });

      const result = await res.json();
      console.log("[MMM-ElPrisAnalogClock] 📥 OpenAI-svar:", JSON.stringify(result, null, 2));
      return result?.choices?.[0]?.message?.content || null;
    }

    return null;
  }
});

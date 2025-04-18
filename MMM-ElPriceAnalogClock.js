
/* global Module, Log */

Module.register("MMM-ElPrisAnalogClock", {
  getStyles() {
    return ["MMM-ElPrisAnalogClock.css"];
  },

  defaults: {
    useAI: false,
    updateInterval: 3600000,
    apiEndpoint: "https://www.elprisetjustnu.se/api/v1/prices/",
    region: "SE4",
    clockSize: 300,
    ringThickness: 20
  },

  start() {
    Log.info("Startar MMM-ElPrisAnalogClock…");
    this.elprisData = [];
    this.aiAnalysis = null;
    this.currentTime = new Date();
    this.getData();
    setInterval(() => {
      this.currentTime = new Date();
      this.updateDom();
    }, 1000);
    setInterval(() => this.getData(), this.config.updateInterval);
  },

  getData() {
    this.sendSocketNotification("GET_ELPRIS", {
      apiEndpoint: this.config.apiEndpoint,
      region: this.config.region,
      useAI: this.config.useAI,
      apiKey: this.config.apiKey,
      aiProvider: this.config.aiProvider
    });
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "ELPRIS_RESULT") {
      this.elprisData = payload.prices || [];
      this.aiAnalysis = payload.analysis || null;
      console.log("✅ AI-analys tilldelad i front-end:", this.aiAnalysis);
      this.updateDom();
    }
  },

  getDom() {
    const cfg = this.config;
    const now = this.currentTime;

    const wrapper = document.createElement("div");
    wrapper.className = "elpris-container";
    wrapper.style.width = cfg.clockSize + "px";
    wrapper.style.height = cfg.clockSize + "px";
    wrapper.style.position = "relative";

    const priser = this.elprisData
      .slice(0, 24)
      .map(d => d.SEK_per_kWh)
      .filter(p => typeof p === "number");

    if (!priser.length) {
      wrapper.innerHTML = "<div>❌ Inga elpriser tillgängliga</div>";
      return wrapper;
    }

    const total = priser.reduce((sum, p) => sum + p, 0);
    const avg = total / priser.length;

    const stdDev = Math.sqrt(priser.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / priser.length);
    const veryCheap = avg - 1.5 * stdDev;
    const cheap = avg - 0.5 * stdDev;
    const expensive = avg + 0.5 * stdDev;
    const veryExp = avg + 1.5 * stdDev;

    const minPris = Math.min(...priser);
    const maxPris = Math.max(...priser);
    const minIndex = this.elprisData.findIndex(d => d.SEK_per_kWh === minPris);
    const maxIndex = this.elprisData.findIndex(d => d.SEK_per_kWh === maxPris);

    const suitableHours = priser
      .map((p, i) => ({ hour: i, price: p }))
      .filter(({ price }) => price >= 0.10 && price <= 0.40);

    const ring = document.createElement("div");
    ring.className = "gradient-ring";
    Object.assign(ring.style, {
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      boxSizing: "border-box",
      padding: cfg.ringThickness + "px",
      position: "absolute",
      top: "0",
      left: "0"
    });

    const sections = [];
    for (let i = 0; i < 24; i++) {
      const p = (this.elprisData[i] || {}).SEK_per_kWh || 0;
      let color;
      if (p < 0) color = "#0000ff";
      else if (p <= veryCheap) color = "#008800";
      else if (p <= cheap) color = "#00cc00";
      else if (p < expensive) color = "#ffff00";
      else if (p < veryExp) color = "#ff7700";
      else color = "#dd0000";
      const startDeg = i * 15;
      const endDeg = startDeg + 15;
      sections.push(`${color} ${startDeg}deg ${endDeg}deg`);
    }

    ring.style.background = `conic-gradient(${sections.join(",")})`;
    wrapper.appendChild(ring);

    const face = document.createElement("div");
    face.className = "clock-face";
    Object.assign(face.style, {
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      background: "rgba(255,255,255,0.9)",
      position: "relative"
    });
    ring.appendChild(face);

    const numRad = (cfg.clockSize / 2 - cfg.ringThickness) - 20;
    for (let i = 0; i < 24; i++) {
      const num = document.createElement("div");
      num.className = "clock-number";
      num.innerText = i;
      Object.assign(num.style, {
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          `rotate(${i * 15}deg) translate(0, -${numRad}px) rotate(${-i * 15}deg) translate(-50%, -50%)`,
        color: "#333"
      });
      face.appendChild(num);
    }

    const outerR = cfg.clockSize / 2;
    const markerRadius = outerR - cfg.ringThickness / 2;
    const angle = (now.getHours() * 15) - 90;

    const marker = document.createElement("div");
    marker.className = "hour-marker";
    Object.assign(marker.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: `${cfg.ringThickness}px`,
      height: `${cfg.ringThickness}px`,
      marginLeft: `-${cfg.ringThickness / 2}px`,
      marginTop: `-${cfg.ringThickness / 2}px`,
      borderRadius: "50%",
      background: "#000",
      transform: `rotate(${angle}deg) translateX(${markerRadius}px)`,
      animation: "blink 1s infinite"
    });

    wrapper.appendChild(marker);

    const info = document.createElement("div");
    info.className = "price-text";
    info.innerHTML =
      `Pris nu:<br><strong>${((this.elprisData[now.getHours()] || {}).SEK_per_kWh || 0).toFixed(2)} kr/kWh</strong><br>` +
      `Snitt:<br><strong>${avg.toFixed(2)} kr/kWh</strong>`;
    face.appendChild(info);

    const legend = document.createElement("div");
    legend.className = "legend-box";
    legend.style.marginTop = "20px";
    legend.style.fontSize = "12px";
    legend.style.padding = "10px";
    legend.style.background = "rgba(255,255,255,0.3)";
    legend.style.borderRadius = "10px";

    const items = [
      { color: "#0000ff", text: "Negativt pris (< 0 kr/kWh)" },
      { color: "#008800", text: `Mycket billigt (< ${veryCheap.toFixed(2)} kr)` },
      { color: "#00cc00", text: `Billigt (< ${cheap.toFixed(2)} kr)` },
      { color: "#ffff00", text: `Normalt (< ${expensive.toFixed(2)} kr)` },
      { color: "#ff7700", text: `Dyrt (< ${veryExp.toFixed(2)} kr)` },
      { color: "#dd0000", text: `Mycket dyrt (≥ ${veryExp.toFixed(2)} kr)` }
    ];

    items.forEach(({ color, text }) => {
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.marginBottom = "4px";

      const box = document.createElement("div");
      box.style.width = "12px";
      box.style.height = "12px";
      box.style.backgroundColor = color;
      box.style.marginRight = "6px";
      box.style.border = "1px solid #000";

      const label = document.createElement("span");
      label.textContent = text;

      item.appendChild(box);
      item.appendChild(label);
      legend.appendChild(item);
    });

    const summary = document.createElement("div");
    summary.style.marginTop = "10px";
    summary.style.paddingTop = "10px";
    summary.style.borderTop = "1px solid rgba(0,0,0,0.1)";
    summary.style.fontSize = "14px";
    summary.style.fontStyle = "italic";
    summary.style.textAlign = "left";
    summary.style.color = "#000";
    summary.style.width = cfg.clockSize + "px";
    summary.style.wordBreak = "break-word";

    summary.innerHTML = this.aiAnalysis
      ? `<strong>AI-analys:</strong><br>${this.aiAnalysis.replace(/\n/g, "<br>")}`
      : "💡 Ingen AI-analys tillgänglig.";

    legend.appendChild(summary);

    const mainWrapper = document.createElement("div");
    mainWrapper.style.display = "flex";
    mainWrapper.style.flexDirection = "column";
    mainWrapper.style.alignItems = "center";

    mainWrapper.appendChild(wrapper);
    mainWrapper.appendChild(legend);

    return mainWrapper;
  }
});

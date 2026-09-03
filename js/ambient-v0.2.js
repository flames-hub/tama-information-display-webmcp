export class AmbientController {
  constructor(config) {
    this.config = config;
    this.layers = [...document.querySelectorAll("[data-background-layer]")];
    this.activeLayer = 0;
    this.backgroundId = null;
    this.backgroundTimer = null;
    this.clockTimer = null;
    this.shiftTimer = null;
    this.shiftTarget = document.querySelector("[data-pixel-shift]");
    this.typeLabel = document.querySelector("#ambient-type-label");
    this.catalog = {
      categories: [],
      images: config.backgrounds.map((src, index) => ({ id: `legacy-${index}`, category: "abstract", src, defaultStatus: "accepted" }))
    };
    this.ambientType = "all";
    this.decisions = {};
  }

  start() {
    this.updateClock();
    this.clockTimer = window.setInterval(() => this.updateClock(), 1000);
    this.changeBackground();
    this.resetBackgroundTimer();
    this.applyPixelShift();
    this.shiftTimer = window.setInterval(() => this.applyPixelShift(), this.config.pixelShiftSeconds * 1000);
  }

  setBackgroundInterval(minutes) {
    this.config.backgroundChangeMinutes = minutes;
    this.resetBackgroundTimer();
  }

  setLibrary(catalog, ambientType, decisions) {
    if (Array.isArray(catalog?.images) && catalog.images.length) this.catalog = catalog;
    this.ambientType = ambientType || "all";
    this.decisions = { ...decisions };
    this.backgroundId = null;
    this.changeBackground();
  }

  setAmbientType(type) {
    this.ambientType = type || "all";
    this.backgroundId = null;
    this.changeBackground();
  }

  setImageDecisions(decisions) {
    this.decisions = { ...decisions };
    const current = this.catalog.images.find((image) => image.id === this.backgroundId);
    if (!current || this.statusFor(current) !== "accepted" || (this.ambientType !== "all" && current.category !== this.ambientType)) {
      this.backgroundId = null;
      this.changeBackground();
    }
  }

  resetBackgroundTimer() {
    window.clearInterval(this.backgroundTimer);
    this.backgroundTimer = window.setInterval(() => this.changeBackground(), this.config.backgroundChangeMinutes * 60 * 1000);
  }

  updateClock() {
    const now = new Date();
    const time = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
    const date = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(now);
    const compactDate = new Intl.DateTimeFormat("ja-JP", { month: "2-digit", day: "2-digit" }).format(now).replace("/", ".");
    document.querySelector("#ambient-time").textContent = time;
    document.querySelector("#ambient-date").textContent = date;
    document.querySelector("#system-time-compact").textContent = time;
    document.querySelector("#os-date").textContent = compactDate;
  }

  changeBackground() {
    const backgrounds = this.availableImages();
    if (!backgrounds.length || !this.layers.length) return;
    let nextIndex = Math.floor(Math.random() * backgrounds.length);
    if (backgrounds.length > 1 && backgrounds[nextIndex].id === this.backgroundId) nextIndex = (nextIndex + 1) % backgrounds.length;
    const nextBackground = backgrounds[nextIndex];
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const nextLayer = this.activeLayer === 0 ? 1 : 0;
      this.layers[nextLayer].style.backgroundImage = `url("${nextBackground.src}")`;
      this.layers[nextLayer].classList.add("is-visible");
      this.layers[this.activeLayer].classList.remove("is-visible");
      this.activeLayer = nextLayer;
      this.backgroundId = nextBackground.id;
      this.updateTypeLabel(nextBackground.category);
    };
    image.src = nextBackground.src;
  }

  availableImages() {
    const accepted = this.catalog.images.filter((image) => this.statusFor(image) === "accepted");
    const selected = this.ambientType === "all" ? accepted : accepted.filter((image) => image.category === this.ambientType);
    return selected.length ? selected : accepted;
  }

  statusFor(image) {
    return this.decisions[image.id] || image.defaultStatus || "candidate";
  }

  updateTypeLabel(categoryId) {
    if (!this.typeLabel) return;
    const category = this.catalog.categories.find((item) => item.id === categoryId);
    this.typeLabel.textContent = `AMBIENT · ${category?.label || "CURATED"}`;
  }

  applyPixelShift() {
    if (!this.shiftTarget) return;
    const range = 8;
    const x = Math.round(Math.random() * range * 2 - range);
    const y = Math.round(Math.random() * range * 2 - range);
    this.shiftTarget.style.setProperty("--pixel-x", `${x}px`);
    this.shiftTarget.style.setProperty("--pixel-y", `${y}px`);
  }

  setWeather(summary) {
    document.querySelector("#ambient-weather-symbol").textContent = summary.symbol || "—";
    document.querySelector("#ambient-weather-label").textContent = summary.description || "天気情報を取得できません";
    document.querySelector("#ambient-temperature").textContent = Number.isFinite(summary.temperature) ? Math.round(summary.temperature) : "--";
    document.querySelector("#ambient-temperature-range").textContent = `H ${formatTemperature(summary.high)} / L ${formatTemperature(summary.low)}`;
    document.querySelector("#os-weather-summary").textContent = Number.isFinite(summary.temperature)
      ? `${summary.description} · ${Math.round(summary.temperature)}°`
      : "天気情報を取得できません";
  }
}

function formatTemperature(value) {
  return Number.isFinite(value) ? `${Math.round(value)}°` : "--°";
}

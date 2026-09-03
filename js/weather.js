const CACHE_KEY = "tama-info:weather:v1";

const WEATHER_CODES = [
  { codes: [0], label: "快晴", symbol: "○" },
  { codes: [1], label: "晴れ", symbol: "◯" },
  { codes: [2], label: "晴れ時々曇り", symbol: "◒" },
  { codes: [3], label: "曇り", symbol: "●" },
  { codes: [45, 48], label: "霧", symbol: "≋" },
  { codes: [51, 53, 55, 56, 57], label: "霧雨", symbol: "┆" },
  { codes: [61, 63, 65, 66, 67, 80, 81, 82], label: "雨", symbol: "╱" },
  { codes: [71, 73, 75, 77, 85, 86], label: "雪", symbol: "✳" },
  { codes: [95, 96, 99], label: "雷雨", symbol: "ϟ" }
];

export function weatherPresentation(code) {
  return WEATHER_CODES.find((item) => item.codes.includes(Number(code))) || { label: "天気不明", symbol: "—" };
}

export class WeatherController extends EventTarget {
  constructor(config) {
    super();
    this.config = config;
    this.refreshTimer = null;
    this.refreshButton = document.querySelector("#weather-refresh");
    this.refreshButton?.addEventListener("click", () => this.refresh({ manual: true }));
  }

  start() {
    const cached = this.readCache();
    if (cached) this.render(cached.data, { cached: true, cachedAt: cached.savedAt });
    this.refresh();
    this.refreshTimer = window.setInterval(() => this.refresh(), this.config.weatherRefreshMinutes * 60 * 1000);
  }

  async refresh({ manual = false } = {}) {
    this.refreshButton?.classList.add("is-loading");
    try {
      const response = await fetch(this.config.weatherEndpoint, { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`weather ${response.status}`);
      const payload = await response.json();
      if (!this.isValid(payload)) throw new Error("invalid weather payload");
      this.saveCache(payload);
      this.render(payload, { cached: false });
      this.setError(false);
      if (manual) this.dispatchEvent(new CustomEvent("notice", { detail: "天気を更新しました" }));
    } catch {
      const cached = this.readCache();
      if (cached) {
        this.render(cached.data, { cached: true, cachedAt: cached.savedAt });
        this.setError(false);
      } else {
        this.setError(true);
        this.dispatchSummary({ description: "天気情報を取得できません" });
      }
      if (manual) this.dispatchEvent(new CustomEvent("notice", { detail: "更新できませんでした。保存データを表示します" }));
    } finally {
      this.refreshButton?.classList.remove("is-loading");
    }
  }

  isValid(payload) {
    return payload && payload.current && Array.isArray(payload.hourly?.time) && Array.isArray(payload.daily?.time);
  }

  render(payload, { cached = false, cachedAt = null } = {}) {
    const current = payload.current;
    const daily = payload.daily;
    const presentation = weatherPresentation(current.weather_code);
    setText("#weather-symbol", presentation.symbol);
    setText("#weather-temperature", `${round(current.temperature_2m)}°`);
    setText("#weather-description", presentation.label);
    setText("#weather-high-low", `${round(daily.temperature_2m_max?.[0])}° / ${round(daily.temperature_2m_min?.[0])}°`);
    setText("#weather-precipitation", `${round(daily.precipitation_probability_max?.[0])}%`);
    setText("#weather-apparent", `${round(current.apparent_temperature)}°`);
    setText("#weather-wind", `${round(current.wind_speed_10m)} km/h`);

    const updated = cached ? `保存データ · ${formatUpdated(cachedAt)}` : `更新 ${formatUpdated(Date.now())}`;
    setText("#weather-updated", updated);
    this.renderHourly(payload.hourly);
    this.renderWeekly(daily);
    this.dispatchSummary({
      symbol: presentation.symbol,
      description: presentation.label,
      temperature: numberOrNull(current.temperature_2m),
      high: numberOrNull(daily.temperature_2m_max?.[0]),
      low: numberOrNull(daily.temperature_2m_min?.[0])
    });
  }

  renderHourly(hourly) {
    const container = document.querySelector("#hourly-forecast");
    container.replaceChildren();
    const now = new Date();
    let start = hourly.time.findIndex((time) => new Date(time) >= new Date(now.getTime() - 30 * 60 * 1000));
    if (start < 0) start = 0;
    const end = Math.min(hourly.time.length, start + 12);

    for (let index = start; index < end; index += 1) {
      const item = document.createElement("article");
      item.className = "hourly-item";
      const time = document.createElement("time");
      time.dateTime = hourly.time[index];
      time.textContent = index === start ? "いま" : new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(hourly.time[index]));
      const symbol = document.createElement("span");
      symbol.className = "hourly-item__symbol";
      symbol.setAttribute("aria-label", weatherPresentation(hourly.weather_code?.[index]).label);
      symbol.textContent = weatherPresentation(hourly.weather_code?.[index]).symbol;
      const temp = document.createElement("strong");
      temp.textContent = `${round(hourly.temperature_2m?.[index])}°`;
      const rain = document.createElement("small");
      rain.textContent = `雨 ${round(hourly.precipitation_probability?.[index])}%`;
      item.append(time, symbol, temp, rain);
      container.append(item);
    }
  }

  renderWeekly(daily) {
    const container = document.querySelector("#weekly-forecast");
    container.replaceChildren();
    daily.time.slice(0, 7).forEach((date, index) => {
      const row = document.createElement("article");
      row.className = "weekly-row";
      const day = document.createElement("time");
      day.dateTime = date;
      day.textContent = index === 0 ? "今日" : new Intl.DateTimeFormat("ja-JP", { weekday: "short", month: "numeric", day: "numeric" }).format(new Date(`${date}T12:00:00`));
      const state = document.createElement("span");
      const presentation = weatherPresentation(daily.weather_code?.[index]);
      state.className = "weekly-row__state";
      state.textContent = `${presentation.symbol}  ${presentation.label}`;
      const rain = document.createElement("span");
      rain.className = "weekly-row__rain";
      rain.textContent = `${round(daily.precipitation_probability_max?.[index])}%`;
      const range = document.createElement("strong");
      range.textContent = `${round(daily.temperature_2m_max?.[index])}°  /  ${round(daily.temperature_2m_min?.[index])}°`;
      row.append(day, state, rain, range);
      container.append(row);
    });
  }

  dispatchSummary(summary) {
    this.dispatchEvent(new CustomEvent("update", { detail: summary }));
  }

  setError(visible) {
    const error = document.querySelector("#weather-error");
    error.hidden = !visible;
    document.querySelector("#weather-current").classList.toggle("is-unavailable", visible);
  }

  readCache() {
    try {
      const value = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (!value?.data || !value.savedAt) return null;
      return value;
    } catch {
      return null;
    }
  }

  saveCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() })); } catch { /* optional */ }
  }
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function round(value) {
  const number = numberOrNull(value);
  return number === null ? "--" : Math.round(number);
}

function formatUpdated(value) {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

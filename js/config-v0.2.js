const fallbackConfig = Object.freeze({
  appName: "TAMA Information Display",
  version: "0.2.0",
  defaultScreen: "ambient",
  ambientReturnMinutes: 5,
  backgroundChangeMinutes: 15,
  weatherRefreshMinutes: 30,
  pixelShiftSeconds: 120,
  weatherEndpoint: "./api/weather.php",
  backgroundCatalogEndpoint: "./data/backgrounds.json",
  weatherLocation: {
    name: "奈良市",
    latitude: 34.6851,
    longitude: 135.8048,
    timezone: "Asia/Tokyo"
  },
  backgrounds: ["./assets/backgrounds/library/towns/town-01.webp"],
  webPages: []
});

const SETTINGS_KEY = "tama-info:settings:v1";
const BACKGROUND_STATUSES = new Set(["candidate", "accepted", "rejected"]);

function numberInRange(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function loadLocalSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

export async function loadConfig() {
  let source = {};
  try {
    const response = await fetch("./data/config.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`config ${response.status}`);
    source = await response.json();
  } catch {
    source = {};
  }

  let catalogSource = {};
  try {
    const response = await fetch(source.backgroundCatalogEndpoint || fallbackConfig.backgroundCatalogEndpoint, { cache: "no-store" });
    if (!response.ok) throw new Error(`background catalog ${response.status}`);
    catalogSource = await response.json();
  } catch {
    catalogSource = {};
  }

  const local = loadLocalSettings();
  const backgroundCatalog = normalizeBackgroundCatalog(catalogSource, source.backgrounds);
  const validCategories = new Set(["all", ...backgroundCatalog.categories.map((category) => category.id)]);
  const ambientType = validCategories.has(local.ambientType) ? local.ambientType : "all";
  const imageIds = new Set(backgroundCatalog.images.map((image) => image.id));
  const backgroundDecisions = Object.fromEntries(
    Object.entries(local.backgroundDecisions || {}).filter(([id, status]) => imageIds.has(id) && BACKGROUND_STATUSES.has(status))
  );
  return {
    ...fallbackConfig,
    ...source,
    ambientReturnMinutes: numberInRange(local.ambientReturnMinutes ?? source.ambientReturnMinutes, fallbackConfig.ambientReturnMinutes, 1, 30),
    backgroundChangeMinutes: numberInRange(local.backgroundChangeMinutes ?? source.backgroundChangeMinutes, fallbackConfig.backgroundChangeMinutes, 1, 60),
    weatherRefreshMinutes: numberInRange(source.weatherRefreshMinutes, fallbackConfig.weatherRefreshMinutes, 5, 180),
    pixelShiftSeconds: numberInRange(source.pixelShiftSeconds, fallbackConfig.pixelShiftSeconds, 30, 900),
    weatherLocation: { ...fallbackConfig.weatherLocation, ...(source.weatherLocation || {}) },
    backgrounds: Array.isArray(source.backgrounds) && source.backgrounds.length ? source.backgrounds.filter((item) => typeof item === "string") : fallbackConfig.backgrounds,
    backgroundCatalog,
    ambientType,
    backgroundDecisions,
    webPages: Array.isArray(source.webPages) ? source.webPages : []
  };
}

function normalizeBackgroundCatalog(source, legacyBackgrounds) {
  const categories = Array.isArray(source.categories)
    ? source.categories.filter((item) => item && typeof item.id === "string" && typeof item.label === "string")
    : [];
  const categoryIds = new Set(categories.map((category) => category.id));
  const acceptedIds = new Set(Array.isArray(source.acceptedIds) ? source.acceptedIds : []);
  const setImages = Array.isArray(source.sets)
    ? source.sets.flatMap((set) => {
      if (!set || !categoryIds.has(set.category) || !/^[a-z0-9-]+$/.test(set.prefix || "") || !/^[a-z0-9-]+$/.test(set.directory || "")) return [];
      const count = numberInRange(set.count, 0, 0, 99);
      return Array.from({ length: count }, (_, index) => {
        const sequence = String(index + 1).padStart(2, "0");
        const id = `${set.prefix}-${sequence}`;
        return {
          id,
          category: set.category,
          title: set.titles?.[index] || `${categories.find((category) => category.id === set.category)?.label || set.category} ${sequence}`,
          description: set.descriptions?.[index] || set.description || "",
          src: `./assets/backgrounds/library/${set.directory}/${id}.webp`,
          thumbnail: `./assets/backgrounds/thumbnails/${id}.webp`,
          defaultStatus: acceptedIds.has(id) ? "accepted" : set.defaultStatus || "candidate"
        };
      });
    })
    : [];
  const rawImages = [...(Array.isArray(source.images) ? source.images : []), ...setImages];
  const seenSources = new Set();
  const images = rawImages
    .filter((item) => item
      && typeof item.id === "string"
      && typeof item.src === "string"
      && categoryIds.has(item.category)
      && BACKGROUND_STATUSES.has(item.defaultStatus || "candidate"))
    .filter((item) => {
      if (seenSources.has(item.src)) return false;
      seenSources.add(item.src);
      return true;
    });
  if (categories.length && images.length) return { categories, images };

  const sources = Array.isArray(legacyBackgrounds) && legacyBackgrounds.length ? legacyBackgrounds : fallbackConfig.backgrounds;
  return {
    categories: [{ id: "abstract", label: "抽象風景" }],
    images: sources.map((src, index) => ({
      id: `legacy-${index}`,
      category: "abstract",
      title: `Ambient ${index + 1}`,
      description: "既存のAmbient背景",
      src,
      thumbnail: src,
      defaultStatus: "accepted"
    }))
  };
}

export function saveRuntimeSettings(settings) {
  const current = loadLocalSettings();
  const next = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Storage can be disabled in kiosk/private modes; the current session still works.
  }
  return next;
}

const CACHE_PREFIX = "tama-info-";
const CACHE_NAME = "tama-info-v0.4.0-r10-synthetic";
const PRECACHE = [
  "./",
  "./index.html",
  "./css/app-v0.4.css",
  "./js/app-v0.4-r9.js",
  "./js/config-v0.4.js",
  "./js/router-v0.4.js",
  "./js/gestures.js",
  "./js/ambient-v0.3.js",
  "./js/weather.js",
  "./js/webview-v0.4.js",
  "./js/display-controller-v0.4.js",
  "./js/webmcp-adapter-v0.4.js",
  "./js/background-library-v0.3.js",
  "./data/config.json",
  "./data/backgrounds.json",
  "./manifest.webmanifest",
  "./assets/icons/app-icon.svg",
  "./assets/backgrounds/library/towns/town-01.webp",
  "./assets/backgrounds/library/resorts/resort-01.webp",
  "./assets/backgrounds/library/aurora/aurora-01.webp",
  "./web/nara-go/index.html",
  "./web/nara-go/simple.html",
  "./web/nara-go/icon.svg",
  "./web/nara-go/manifest.webmanifest",
  "./web/nara-go/assets/styles.css",
  "./web/nara-go/assets/app-public.js",
  "./web/nara-go/assets/simple.css",
  "./web/nara-go/assets/simple-public.js",
  "./web/nara-go/assets/embed.css",
  "./web/nara-go/assets/embed.js",
  "./web/nara-go/data/timetables-public.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/api/weather.php")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "./index.html"));
    return;
  }
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, fallbackPath) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request, { ignoreSearch: true })) || cache.match(fallbackPath);
  }
}

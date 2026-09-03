import { loadConfig, saveRuntimeSettings } from "./config-v0.2.js";
import { ScreenRouter } from "./router.js";
import { GestureController } from "./gestures.js";
import { AmbientController } from "./ambient-v0.2.js";
import { WeatherController } from "./weather.js";
import { WebViewController } from "./webview.js";
import { BackgroundLibraryController } from "./background-library-v0.2.js";

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let idleTimer = null;
let idleMinutes = 5;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

function updateNetworkStatus() {
  const online = navigator.onLine;
  const element = document.querySelector("#network-state");
  element.textContent = online ? "ONLINE" : "OFFLINE";
  element.classList.toggle("is-offline", !online);
}

function resetIdle(router) {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    if (router.current !== "ambient") router.go("ambient", { reason: "idle" });
  }, idleMinutes * 60 * 1000);
}

function bindSettings(config, ambient, router) {
  const idleInput = document.querySelector("#idle-minutes");
  const backgroundInput = document.querySelector("#background-minutes");
  const idleValue = document.querySelector("#idle-minutes-value");
  const backgroundValue = document.querySelector("#background-minutes-value");
  idleInput.value = String(config.ambientReturnMinutes);
  backgroundInput.value = String(config.backgroundChangeMinutes);
  idleValue.textContent = idleInput.value;
  backgroundValue.textContent = backgroundInput.value;

  idleInput.addEventListener("input", () => { idleValue.textContent = idleInput.value; });
  idleInput.addEventListener("change", () => {
    idleMinutes = Number(idleInput.value);
    saveRuntimeSettings({ ambientReturnMinutes: idleMinutes });
    resetIdle(router);
    showToast(`Ambient復帰を${idleMinutes}分に変更しました`);
  });
  backgroundInput.addEventListener("input", () => { backgroundValue.textContent = backgroundInput.value; });
  backgroundInput.addEventListener("change", () => {
    const minutes = Number(backgroundInput.value);
    ambient.setBackgroundInterval(minutes);
    saveRuntimeSettings({ backgroundChangeMinutes: minutes });
    showToast(`背景切替を${minutes}分に変更しました`);
  });

  document.querySelector("#fullscreen-button").addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      showToast("F11キーで全画面表示にできます");
    }
  });
  document.addEventListener("fullscreenchange", () => {
    document.querySelector("#fullscreen-button").textContent = document.fullscreenElement ? "全画面を終了" : "全画面で表示";
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  try {
    const registration = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    await navigator.serviceWorker.ready;
    document.querySelector("#offline-ready").textContent = "利用可能";
    registration.update().catch(() => {});
  } catch {
    document.querySelector("#offline-ready").textContent = "未利用";
  }
}

async function main() {
  const config = await loadConfig();
  idleMinutes = config.ambientReturnMinutes;
  const router = new ScreenRouter(app, { defaultScreen: "ambient" });
  const ambient = new AmbientController(config);
  const weather = new WeatherController(config);
  const webview = new WebViewController(config.webPages);
  const backgroundLibrary = new BackgroundLibraryController(config, ambient, showToast);

  ambient.start();
  backgroundLibrary.start();
  weather.addEventListener("update", (event) => ambient.setWeather(event.detail));
  weather.addEventListener("notice", (event) => showToast(event.detail));
  weather.start();
  webview.render();
  router.start();

  document.addEventListener("click", (event) => {
    const route = event.target.closest("[data-route]")?.dataset.route;
    if (route) router.go(route, { reason: "tap" });
    if (event.target.closest("[data-action='back']")) router.back();
  });

  new GestureController(document.querySelector("#screen-stack"), {
    left: () => router.next(),
    right: () => router.previous(),
    up: () => router.openOS(),
    down: () => router.back()
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") router.previous();
    if (event.key === "ArrowRight") router.next();
    if (event.key === "ArrowUp") router.openOS();
    if (event.key === "ArrowDown" || event.key === "Escape") router.back();
  });

  const activityEvents = ["pointerdown", "keydown", "wheel"];
  activityEvents.forEach((name) => document.addEventListener(name, () => resetIdle(router), { passive: true }));
  window.addEventListener("message", (event) => {
    if (event.origin === window.location.origin && event.data?.type === "tama-info:activity") resetIdle(router);
  });
  router.addEventListener("change", (event) => {
    resetIdle(router);
    if (event.detail.reason === "idle") showToast("Ambientへ戻りました");
  });

  bindSettings(config, ambient, router);
  updateNetworkStatus();
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  resetIdle(router);
  registerServiceWorker();

  window.setTimeout(() => document.querySelector("#boot-screen")?.classList.add("is-finished"), 220);
}

main().catch(() => {
  document.querySelector("#boot-screen")?.classList.add("is-finished");
  showToast("表示の初期化に失敗しました。再読み込みしてください");
});

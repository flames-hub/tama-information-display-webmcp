import { loadConfig, saveRuntimeSettings } from "./config-v0.4.js";
import { ScreenRouter } from "./router-v0.4.js";
import { GestureController } from "./gestures.js";
import { AmbientController } from "./ambient-v0.3.js";
import { WeatherController } from "./weather.js";
import { WebViewController } from "./webview-v0.4.js";
import { BackgroundLibraryController } from "./background-library-v0.3.js";
import { DisplayController } from "./display-controller-v0.4.js";
import { createWebMCPDebugBridge, registerWebMCP } from "./webmcp-adapter-v0.4.js";

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

function resetIdle(router, display) {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    if (!display.isAgentStateActive() && router.current !== "ambient") {
      router.go("ambient", { reason: "idle", source: "automatic" });
    }
  }, idleMinutes * 60 * 1000);
}

function bindSettings(config, ambient, router, display) {
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
    display.noteHumanActivity("settings");
    idleMinutes = Number(idleInput.value);
    saveRuntimeSettings({ ambientReturnMinutes: idleMinutes });
    resetIdle(router, display);
    showToast(`Ambient復帰を${idleMinutes}分に変更しました`);
  });
  backgroundInput.addEventListener("input", () => { backgroundValue.textContent = backgroundInput.value; });
  backgroundInput.addEventListener("change", () => {
    display.noteHumanActivity("settings");
    const minutes = Number(backgroundInput.value);
    ambient.setBackgroundInterval(minutes);
    saveRuntimeSettings({ backgroundChangeMinutes: minutes });
    showToast(`背景切替を${minutes}分に変更しました`);
  });

  document.querySelector("#fullscreen-button").addEventListener("click", async () => {
    display.noteHumanActivity("fullscreen");
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

function bindAgentActivity(display) {
  const panel = document.querySelector("#agent-activity");
  const text = document.querySelector("#agent-activity-text");
  const time = document.querySelector("#agent-activity-time");
  const undo = document.querySelector("#agent-undo");
  display.addEventListener("agentactivity", (event) => {
    panel.hidden = false;
    panel.dataset.state = event.detail.state;
    text.textContent = event.detail.label;
    time.textContent = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(event.detail.timestamp));
    undo.disabled = !event.detail.undoAvailable;
  });
  undo.addEventListener("click", async () => {
    const result = await display.undoLastAgentAction({ source: "human" });
    if (!result.ok) showToast(result.error.message);
  });
}

function setupWebMCPDebug(display) {
  const debug = document.querySelector("#webmcp-debug");
  const enabled = new URLSearchParams(window.location.search).get("webmcp-debug") === "1";
  if (enabled) {
    debug.hidden = false;
    const bridge = createWebMCPDebugBridge(display);
    window.__tamaWebMCPDebug = bridge;
    debug.addEventListener("click", async (event) => {
      const action = event.target.closest("[data-debug-tool]")?.dataset.debugTool;
      if (!action) return;
      const commands = {
        information: ["show_information", { title: "13時から会議です", message: "13時に会議室Aへお集まりください。", priority: "high", duration_seconds: 0 }],
        weather: ["show_weather", { location: "奈良市" }],
        web: ["open_web_page", { url: "https://tama-hub.xvps.jp/nara-go/simple.html", title: "NARA/GO · SIMPLE" }],
        ambient: ["show_ambient", {}],
        undo: ["undo_last_display_action", {}]
      };
      const [name, input] = commands[action];
      const result = await bridge.executeTool(name, input);
      if (!result.ok) showToast(result.error.message);
    });
  }
  return (status) => {
    document.querySelector("#debug-webmcp-state").textContent = status.available ? "AVAILABLE" : "UNSUPPORTED";
    document.querySelector("#debug-webmcp-tools").textContent = `${status.registered}/${status.expected}`;
  };
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
  const router = new ScreenRouter(app, { defaultScreen: config.defaultScreen || "ambient" });
  const ambient = new AmbientController(config);
  const weather = new WeatherController(config);
  const webview = new WebViewController(config.webPages);
  const backgroundLibrary = new BackgroundLibraryController(config, ambient, showToast);
  const display = new DisplayController({ router, ambient, weather, webview, config, notify: showToast });

  ambient.start();
  backgroundLibrary.start();
  weather.addEventListener("update", (event) => ambient.setWeather(event.detail));
  weather.addEventListener("notice", (event) => showToast(event.detail));
  weather.start();
  webview.render();
  router.start();

  document.addEventListener("click", (event) => {
    const route = event.target.closest("[data-route]")?.dataset.route;
    if (route) display.navigateHuman(route, "tap");
    if (event.target.closest("[data-action='back']")) display.backHuman();
  });

  new GestureController(document.querySelector("#screen-stack"), {
    left: () => display.nextHuman(),
    right: () => display.previousHuman(),
    up: () => display.openOSHuman(),
    down: () => display.backHuman()
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") display.previousHuman();
    if (event.key === "ArrowRight") display.nextHuman();
    if (event.key === "ArrowUp") display.openOSHuman();
    if (event.key === "ArrowDown" || event.key === "Escape") display.backHuman();
  });

  const activityEvents = ["pointerdown", "keydown", "wheel"];
  activityEvents.forEach((name) => document.addEventListener(name, (event) => {
    resetIdle(router, display);
    if (event.isTrusted && !event.target.closest?.("[data-agent-control]")) display.noteHumanActivity(name);
  }, { passive: true, capture: true }));
  window.addEventListener("message", (event) => {
    if (event.origin === window.location.origin && event.data?.type === "tama-info:activity") {
      display.noteHumanActivity("embedded-page");
      resetIdle(router, display);
    }
  });
  router.addEventListener("change", (event) => {
    resetIdle(router, display);
    if (event.detail.reason === "idle") showToast("Ambientへ戻りました");
  });

  bindSettings(config, ambient, router, display);
  bindAgentActivity(display);
  updateNetworkStatus();
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  resetIdle(router, display);
  registerServiceWorker();

  const updateDebug = setupWebMCPDebug(display);
  registerWebMCP({ controller: display, onStatus: updateDebug }).catch(() => updateDebug({ available: true, registered: 0, expected: 7 }));
  window.setTimeout(() => document.querySelector("#boot-screen")?.classList.add("is-finished"), 220);
}

main().catch(() => {
  document.querySelector("#boot-screen")?.classList.add("is-finished");
  showToast("表示の初期化に失敗しました。再読み込みしてください");
});

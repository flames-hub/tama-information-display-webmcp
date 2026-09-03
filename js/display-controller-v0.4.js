const DISPLAY_MODES = new Set(["ambient", "weather", "web", "information"]);
const INFORMATION_PRIORITIES = new Set(["low", "normal", "high", "urgent"]);

export class DisplayController extends EventTarget {
  constructor({ router, ambient, weather, webview, config, notify = () => {}, documentRef = globalThis.document, windowRef = globalThis.window }) {
    super();
    this.router = router;
    this.ambient = ambient;
    this.weather = weather;
    this.webview = webview;
    this.config = config;
    this.notify = notify;
    this.document = documentRef;
    this.window = windowRef;
    this.manualRevision = 0;
    this.agentSequence = 0;
    this.controlOwner = "automatic";
    this.lastAgentAction = null;
    this.agentRestoreTimer = null;
  }

  getStatus() {
    const currentMode = this.router.current || this.config.defaultScreen || "ambient";
    const information = currentMode === "information" ? this.readInformation() : null;
    return {
      ok: true,
      app: this.config.appName,
      version: this.config.version,
      current_mode: currentMode,
      control_owner: this.controlOwner,
      ambient_type: this.ambient.ambientType || this.config.ambientType || "all",
      weather_location: this.config.weatherLocation?.name || null,
      web_page: this.webview.getCurrentPageStatus(),
      information,
      last_agent_action: this.lastAgentAction ? {
        id: this.lastAgentAction.id,
        type: this.lastAgentAction.type,
        label: this.lastAgentAction.label,
        timestamp: this.lastAgentAction.timestamp,
        active: this.lastAgentAction.active,
        undo_available: this.canUndoAgentAction()
      } : null,
      remote_sync: "disabled"
    };
  }

  isAgentStateActive() {
    return this.controlOwner === "agent";
  }

  noteHumanActivity(kind = "manual") {
    this.manualRevision += 1;
    this.controlOwner = "human";
    this.window.clearTimeout(this.agentRestoreTimer);
    this.agentRestoreTimer = null;
    if (this.lastAgentAction?.active) {
      this.lastAgentAction.active = false;
      this.lastAgentAction.invalidatedBy = kind;
      this.emitAgentActivity("manual-priority", `${this.lastAgentAction.label} · 手動操作を優先しました`);
    }
  }

  navigateHuman(target, reason = "tap") {
    this.noteHumanActivity(reason);
    return this.router.go(target, { reason, source: "human" });
  }

  nextHuman() {
    this.noteHumanActivity("swipe-left");
    return this.router.next({ source: "human" });
  }

  previousHuman() {
    this.noteHumanActivity("swipe-right");
    return this.router.previous({ source: "human" });
  }

  openOSHuman() {
    this.noteHumanActivity("swipe-up");
    return this.router.openOS({ source: "human" });
  }

  backHuman() {
    this.noteHumanActivity("back");
    return this.router.back({ source: "human" });
  }

  async setDisplayMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    if (!DISPLAY_MODES.has(normalized)) throw inputError("mode", "ambient / weather / web / information のいずれかを指定してください");
    return this.runAgentAction({
      type: "set_display_mode",
      label: `表示を${displayModeLabel(normalized)}へ変更`,
      perform: async () => {
        this.router.go(normalized, { reason: "webmcp:set-display-mode", source: "agent" });
        return { current_mode: normalized };
      }
    });
  }

  async openWebPage({ url, title = "" } = {}) {
    const safeUrl = requiredText(url, "url", 2048);
    const safeTitle = optionalText(title, "title", 120);
    return this.runAgentAction({
      type: "open_web_page",
      label: `${safeTitle || "Webページ"}を表示`,
      perform: async () => {
        const page = this.webview.openPage({ url: safeUrl, title: safeTitle });
        this.router.go("web", { reason: "webmcp:open-web-page", source: "agent" });
        return { current_mode: "web", page };
      }
    });
  }

  async showInformation({ title, message, priority = "normal", durationSeconds = 0 } = {}) {
    const safeTitle = requiredText(title, "title", 120);
    const safeMessage = requiredText(message, "message", 1200);
    const safePriority = String(priority || "normal").trim().toLowerCase();
    if (!INFORMATION_PRIORITIES.has(safePriority)) throw inputError("priority", "low / normal / high / urgent のいずれかを指定してください");
    const safeDuration = boundedNumber(durationSeconds, "duration_seconds", 0, 3600, 0);
    return this.runAgentAction({
      type: "show_information",
      label: `「${safeTitle}」を表示`,
      durationSeconds: safeDuration,
      perform: async () => {
        this.writeInformation({ title: safeTitle, message: safeMessage, priority: safePriority, durationSeconds: safeDuration });
        this.router.go("information", { reason: "webmcp:show-information", source: "agent" });
        return { current_mode: "information", title: safeTitle, priority: safePriority, duration_seconds: safeDuration };
      }
    });
  }

  async showWeather({ location = "" } = {}) {
    const requestedLocation = optionalText(location, "location", 80);
    return this.runAgentAction({
      type: "show_weather",
      label: `${requestedLocation || this.config.weatherLocation?.name || "現在地"}の天気を表示`,
      perform: async () => {
        this.router.go("weather", { reason: "webmcp:show-weather", source: "agent" });
        this.weather.refresh().catch(() => {});
        const configuredLocation = this.config.weatherLocation?.name || null;
        return {
          current_mode: "weather",
          requested_location: requestedLocation || configuredLocation,
          displayed_location: configuredLocation,
          location_changed: !requestedLocation || requestedLocation === configuredLocation
        };
      }
    });
  }

  async showAmbient() {
    return this.runAgentAction({
      type: "show_ambient",
      label: "Ambientを表示",
      perform: async () => {
        this.router.go("ambient", { reason: "webmcp:show-ambient", source: "agent" });
        return { current_mode: "ambient", ambient_type: this.ambient.ambientType || this.config.ambientType || "all" };
      }
    });
  }

  canUndoAgentAction() {
    return Boolean(this.lastAgentAction?.active && this.lastAgentAction.manualRevision === this.manualRevision);
  }

  async undoLastAgentAction({ source = "agent" } = {}) {
    if (!this.lastAgentAction) return { ok: false, error: { code: "nothing_to_undo", message: "元に戻せるAgent操作はありません" } };
    if (!this.canUndoAgentAction()) {
      return { ok: false, error: { code: "manual_state_preserved", message: "Agent操作後に手動操作が行われたため、現在の表示を保持します" } };
    }

    const action = this.lastAgentAction;
    this.window.clearTimeout(this.agentRestoreTimer);
    this.agentRestoreTimer = null;
    this.restoreSnapshot(action.snapshot, `webmcp:undo:${action.type}`, source);
    action.active = false;
    action.undone = true;
    this.controlOwner = source === "human" ? "human" : action.snapshot.controlOwner;
    this.emitAgentActivity("undone", `${action.label} · 元に戻しました`);
    return { ok: true, undone_action: action.type, current_mode: this.router.current };
  }

  async runAgentAction({ type, label, perform, durationSeconds = 0 }) {
    const snapshot = this.captureSnapshot();
    this.window.clearTimeout(this.agentRestoreTimer);
    this.agentRestoreTimer = null;
    const details = await perform();
    const action = {
      id: `agent-${++this.agentSequence}`,
      type,
      label,
      timestamp: new Date().toISOString(),
      snapshot,
      manualRevision: this.manualRevision,
      active: true
    };
    this.lastAgentAction = action;
    this.controlOwner = "agent";
    this.emitAgentActivity("completed", label);

    if (durationSeconds > 0) {
      this.agentRestoreTimer = this.window.setTimeout(() => {
        if (this.lastAgentAction?.id !== action.id || !this.canUndoAgentAction()) return;
        this.restoreSnapshot(snapshot, `webmcp:duration:${type}`, "agent");
        action.active = false;
        action.expired = true;
        this.controlOwner = snapshot.controlOwner;
        this.emitAgentActivity("expired", `${label} · 表示時間が終了しました`);
      }, durationSeconds * 1000);
    }

    return { ok: true, action_id: action.id, ...details, undo_available: true };
  }

  captureSnapshot() {
    return {
      screen: this.router.current || this.config.defaultScreen || "ambient",
      controlOwner: this.controlOwner,
      webview: this.webview.getState(),
      information: this.readInformation()
    };
  }

  restoreSnapshot(snapshot, reason, source) {
    this.webview.restoreState(snapshot.webview);
    this.writeInformation(snapshot.information);
    this.router.go(snapshot.screen, { record: false, reason, source });
  }

  readInformation() {
    return {
      title: this.document.querySelector("#information-title")?.textContent || "",
      message: this.document.querySelector("#information-message")?.textContent || "",
      priority: this.document.querySelector("#information-panel")?.dataset.priority || "normal",
      duration_seconds: Number(this.document.querySelector("#information-panel")?.dataset.durationSeconds || 0)
    };
  }

  writeInformation({ title = "Agentからのお知らせ", message = "", priority = "normal", durationSeconds = 0, duration_seconds } = {}) {
    const panel = this.document.querySelector("#information-panel");
    const titleElement = this.document.querySelector("#information-title");
    const messageElement = this.document.querySelector("#information-message");
    const priorityElement = this.document.querySelector("#information-priority");
    const durationElement = this.document.querySelector("#information-duration");
    const seconds = Number.isFinite(Number(durationSeconds)) ? Number(durationSeconds) : Number(duration_seconds || 0);
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    if (panel) {
      panel.dataset.priority = priority;
      panel.dataset.durationSeconds = String(seconds);
    }
    if (priorityElement) priorityElement.textContent = priorityLabel(priority);
    if (durationElement) durationElement.textContent = seconds > 0 ? `${seconds}秒` : "手動で切り替えるまで";
  }

  emitAgentActivity(state, label) {
    this.dispatchEvent(new CustomEvent("agentactivity", {
      detail: {
        state,
        label,
        timestamp: this.lastAgentAction?.timestamp || new Date().toISOString(),
        undoAvailable: this.canUndoAgentAction()
      }
    }));
  }
}

function requiredText(value, field, maxLength) {
  const text = String(value ?? "").trim();
  if (!text) throw inputError(field, `${field}は必須です`);
  if (text.length > maxLength) throw inputError(field, `${field}は${maxLength}文字以内で指定してください`);
  return text;
}

function optionalText(value, field, maxLength) {
  const text = String(value ?? "").trim();
  if (text.length > maxLength) throw inputError(field, `${field}は${maxLength}文字以内で指定してください`);
  return text;
}

function boundedNumber(value, field, min, max, fallback) {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw inputError(field, `${field}は${min}から${max}の数値で指定してください`);
  return number;
}

function inputError(field, message) {
  const error = new TypeError(message);
  error.code = "invalid_input";
  error.field = field;
  return error;
}

function displayModeLabel(mode) {
  return ({ ambient: "Ambient", weather: "Weather", web: "Web", information: "Information" })[mode] || mode;
}

function priorityLabel(priority) {
  return ({ low: "LOW", normal: "NORMAL", high: "HIGH", urgent: "URGENT" })[priority] || "NORMAL";
}

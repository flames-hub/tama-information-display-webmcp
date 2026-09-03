import test from "node:test";
import assert from "node:assert/strict";
import { DisplayController } from "../js/display-controller-v0.4.js";

if (!globalThis.CustomEvent) {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type);
      this.detail = options.detail;
    }
  };
}

function createFixture() {
  const elements = new Map([
    ["#information-panel", { dataset: { priority: "normal", durationSeconds: "0" } }],
    ["#information-title", { textContent: "" }],
    ["#information-message", { textContent: "" }],
    ["#information-priority", { textContent: "" }],
    ["#information-duration", { textContent: "" }]
  ]);
  const documentRef = { querySelector: (selector) => elements.get(selector) || null };
  const router = {
    current: "ambient",
    go(target) { this.current = target; return true; },
    next() { this.current = "weather"; return true; },
    previous() { this.current = "web"; return true; },
    openOS() { this.current = "information-os"; return true; },
    back() { this.current = "ambient"; return true; }
  };
  const webview = {
    state: { currentPage: null },
    getState() { return structuredClone(this.state); },
    restoreState(state) { this.state = structuredClone(state || { currentPage: null }); },
    getCurrentPageStatus() { return null; },
    openPage({ url, title }) { return { url, title }; }
  };
  const controller = new DisplayController({
    router,
    ambient: { ambientType: "all" },
    weather: { refresh: async () => {} },
    webview,
    config: { appName: "TAMA", version: "0.4.0", defaultScreen: "ambient", ambientType: "all", weatherLocation: { name: "奈良市" } },
    documentRef,
    windowRef: { setTimeout, clearTimeout }
  });
  return { controller, router, elements };
}

test("Agent情報表示はtextContentへ反映されUndoできる", async () => {
  const { controller, router, elements } = createFixture();
  const result = await controller.showInformation({ title: "会議", message: "10時からです", priority: "high" });
  assert.equal(result.ok, true);
  assert.equal(router.current, "information");
  assert.equal(elements.get("#information-title").textContent, "会議");
  assert.equal(elements.get("#information-message").textContent, "10時からです");
  const undo = await controller.undoLastAgentAction({ source: "human" });
  assert.equal(undo.ok, true);
  assert.equal(router.current, "ambient");
});

test("Agent操作後の手動操作をUndoや自動復帰で上書きしない", async () => {
  const { controller, router } = createFixture();
  await controller.setDisplayMode("weather");
  controller.navigateHuman("web", "tap");
  const undo = await controller.undoLastAgentAction({ source: "agent" });
  assert.equal(undo.ok, false);
  assert.equal(undo.error.code, "manual_state_preserved");
  assert.equal(router.current, "web");
  assert.equal(controller.isAgentStateActive(), false);
});

test("時間指定Informationも手動操作後は復帰しない", async () => {
  const { controller, router } = createFixture();
  await controller.showInformation({ title: "短い表示", message: "確認", durationSeconds: 0.01 });
  controller.navigateHuman("web", "tap");
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(router.current, "web");
});

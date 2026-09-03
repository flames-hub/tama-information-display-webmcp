import test from "node:test";
import assert from "node:assert/strict";
import { createWebMCPDebugBridge, registerWebMCP } from "../js/webmcp-adapter-v0.4.js";

function createController() {
  return {
    getStatus: () => ({ ok: true, current_mode: "ambient" }),
    setDisplayMode: async (mode) => ({ ok: true, current_mode: mode }),
    openWebPage: async ({ url }) => ({ ok: true, url }),
    showInformation: async ({ title }) => ({ ok: true, title }),
    showWeather: async ({ location }) => ({ ok: true, location }),
    showAmbient: async () => ({ ok: true, current_mode: "ambient" }),
    undoLastAgentAction: async () => ({ ok: true, undone_action: "show_ambient" })
  };
}

test("WebMCP非対応環境では登録を安全にスキップする", async () => {
  const statuses = [];
  const result = await registerWebMCP({
    controller: createController(),
    documentRef: {},
    windowRef: {},
    onStatus: (status) => statuses.push(status)
  });
  assert.equal(result.available, false);
  assert.equal(result.registered, 0);
  assert.equal(statuses[0].reason, "unsupported");
});

test("7つのToolを登録し、既存Controllerへ委譲する", async () => {
  const tools = [];
  const modelContext = { registerTool: async (tool) => { tools.push(tool); } };
  const result = await registerWebMCP({
    controller: createController(),
    documentRef: { modelContext },
    windowRef: { addEventListener() {} }
  });
  assert.equal(result.available, true);
  assert.equal(result.registered, 7);
  assert.deepEqual(tools.map((tool) => tool.name), [
    "get_display_status",
    "set_display_mode",
    "open_web_page",
    "show_information",
    "show_weather",
    "show_ambient",
    "undo_last_display_action"
  ]);
  const modeResult = await tools.find((tool) => tool.name === "set_display_mode").execute({ mode: "weather" });
  assert.deepEqual(modeResult, { ok: true, current_mode: "weather" });
});

test("Tool登録失敗を通常UIへ例外として伝播しない", async () => {
  const result = await registerWebMCP({
    controller: createController(),
    documentRef: { modelContext: { registerTool: async () => { throw new Error("registration failed"); } } },
    windowRef: { addEventListener() {} }
  });
  assert.equal(result.available, true);
  assert.equal(result.registered, 0);
  assert.equal(result.failed, 7);
});

test("Debug bridgeも登録Toolと同じcallbackを使う", async () => {
  const bridge = createWebMCPDebugBridge(createController());
  assert.equal(bridge.listTools().length, 7);
  assert.deepEqual(await bridge.executeTool("show_ambient"), { ok: true, current_mode: "ambient" });
  assert.equal((await bridge.executeTool("unknown")).error.code, "unknown_tool");
});

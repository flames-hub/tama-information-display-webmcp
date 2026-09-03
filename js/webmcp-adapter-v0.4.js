const TOOL_COUNT = 7;

export async function registerWebMCP({ controller, documentRef = globalThis.document, windowRef = globalThis.window, onStatus = () => {} }) {
  const modelContext = documentRef?.modelContext;
  if (!modelContext || typeof modelContext.registerTool !== "function") {
    onStatus({ available: false, registered: 0, expected: TOOL_COUNT, reason: "unsupported" });
    return { available: false, registered: 0, expected: TOOL_COUNT };
  }

  const lifecycle = new AbortController();
  const tools = createToolDefinitions(controller);
  try {
    const registrations = await Promise.allSettled(
      tools.map((tool) => Promise.resolve(modelContext.registerTool(tool, { signal: lifecycle.signal })))
    );
    const registered = registrations.filter((result) => result.status === "fulfilled").length;
    const failed = registrations.length - registered;
    onStatus({ available: true, registered, failed, expected: TOOL_COUNT });
    windowRef?.addEventListener?.("pagehide", () => lifecycle.abort(), { once: true });
    return { available: true, registered, failed, expected: TOOL_COUNT, lifecycle };
  } catch (error) {
    lifecycle.abort();
    onStatus({ available: true, registered: 0, failed: TOOL_COUNT, expected: TOOL_COUNT, reason: safeErrorMessage(error) });
    return { available: true, registered: 0, failed: TOOL_COUNT, expected: TOOL_COUNT };
  }
}

export function createToolDefinitions(controller) {
  return [
    {
      name: "get_display_status",
      title: "Get display status",
      description: "TAMA Information Displayの現在の画面、操作主体、Ambientタイプ、Web表示、直前のAgent操作を取得します。",
      inputSchema: emptyObjectSchema(),
      annotations: { readOnlyHint: true },
      execute: () => safeExecute(() => controller.getStatus())
    },
    {
      name: "set_display_mode",
      title: "Set display mode",
      description: "既存の画面遷移を使ってAmbient、Weather、Web、Informationのいずれかを表示します。",
      inputSchema: {
        type: "object",
        properties: { mode: { type: "string", enum: ["ambient", "weather", "web", "information"] } },
        required: ["mode"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false },
      execute: (input = {}) => safeExecute(() => controller.setDisplayMode(input.mode))
    },
    {
      name: "open_web_page",
      title: "Open configured web page",
      description: "許可済みURLを検証し、既存Web表示へ安全な同一オリジンコピーとして表示します。NARA/GOの通常表示とsimple.htmlに対応します。",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", minLength: 1, maxLength: 2048 },
          title: { type: "string", maxLength: 120 }
        },
        required: ["url"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: (input = {}) => safeExecute(() => controller.openWebPage(input))
    },
    {
      name: "show_information",
      title: "Show information",
      description: "タイトルと本文をInformation画面へテキストとして表示します。指定秒数後の復帰は、その間に手動操作がない場合だけ実行します。",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 120 },
          message: { type: "string", minLength: 1, maxLength: 1200 },
          priority: { type: "string", enum: ["low", "normal", "high", "urgent"], default: "normal" },
          duration_seconds: { type: "number", minimum: 0, maximum: 3600, default: 0 }
        },
        required: ["title", "message"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: (input = {}) => safeExecute(() => controller.showInformation({
        title: input.title,
        message: input.message,
        priority: input.priority,
        durationSeconds: input.duration_seconds
      }))
    },
    {
      name: "show_weather",
      title: "Show weather",
      description: "既存のWeather画面を表示して更新します。現在の実装地点は奈良市で、要求地点と実表示地点を結果で区別します。",
      inputSchema: {
        type: "object",
        properties: { location: { type: "string", maxLength: 80 } },
        additionalProperties: false
      },
      annotations: { readOnlyHint: false },
      execute: (input = {}) => safeExecute(() => controller.showWeather(input))
    },
    {
      name: "show_ambient",
      title: "Show ambient",
      description: "既存のAmbient画面と、利用者が選択済みのAmbientタイプを表示します。",
      inputSchema: emptyObjectSchema(),
      annotations: { readOnlyHint: false },
      execute: () => safeExecute(() => controller.showAmbient())
    },
    {
      name: "undo_last_display_action",
      title: "Undo last display action",
      description: "直前のAgent操作だけを元に戻します。操作後に人間が触れていた場合は手動状態を保護して拒否します。",
      inputSchema: emptyObjectSchema(),
      annotations: { readOnlyHint: false },
      execute: () => safeExecute(() => controller.undoLastAgentAction({ source: "agent" }))
    }
  ];
}

export function createWebMCPDebugBridge(controller) {
  const tools = new Map(createToolDefinitions(controller).map((tool) => [tool.name, tool]));
  return Object.freeze({
    listTools: () => [...tools.keys()],
    executeTool: async (name, input = {}) => {
      const tool = tools.get(name);
      if (!tool) return { ok: false, error: { code: "unknown_tool", message: "指定されたToolはありません" } };
      return tool.execute(input);
    }
  });
}

async function safeExecute(action) {
  try {
    return await action();
  } catch (error) {
    return {
      ok: false,
      error: {
        code: typeof error?.code === "string" ? error.code : "display_action_failed",
        field: typeof error?.field === "string" ? error.field : undefined,
        message: safeErrorMessage(error)
      }
    };
  }
}

function safeErrorMessage(error) {
  return typeof error?.message === "string" && error.message ? error.message.slice(0, 240) : "表示操作を完了できませんでした";
}

function emptyObjectSchema() {
  return { type: "object", properties: {}, additionalProperties: false };
}

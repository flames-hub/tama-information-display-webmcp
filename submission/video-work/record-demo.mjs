import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const playwrightModule = process.env.PLAYWRIGHT_MODULE;
if (!playwrightModule) throw new Error("PLAYWRIGHT_MODULE is not set");
const { chromium } = require(playwrightModule);

const options = parseArguments(process.argv.slice(2));
await fs.mkdir(path.dirname(options.output), { recursive: true });
const videoDirectory = path.join(path.dirname(options.output), "playwright-video");
await fs.mkdir(videoDirectory, { recursive: true });

const browser = await chromium.launch({
  executablePath: options.browser,
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars", "--force-device-scale-factor=1"]
});

const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  screen: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  serviceWorkers: "block",
  recordVideo: {
    dir: videoDirectory,
    size: { width: 1920, height: 1080 }
  }
});

await context.addInitScript(() => {
  try {
    localStorage.setItem("tama-info:settings:v1", JSON.stringify({
      ambientType: "towns",
      backgroundDecisions: {
        "abstract-01": "rejected",
        "abstract-02": "rejected",
        "abstract-03": "rejected",
        "town-01": "accepted"
      }
    }));
  } catch {
    // about:blank and opaque origins may reject storage before navigation.
  }

  const registry = new Map();
  const modelContext = {
    registerTool(tool, options = {}) {
      if (!tool || typeof tool.name !== "string" || typeof tool.execute !== "function") {
        throw new TypeError("Invalid WebMCP tool definition");
      }
      registry.set(tool.name, tool);
      options.signal?.addEventListener?.("abort", () => registry.delete(tool.name), { once: true });
    },
    __listTools() {
      return [...registry.keys()];
    },
    async __execute(name, input = {}) {
      const tool = registry.get(name);
      if (!tool) throw new Error(`Unknown WebMCP tool: ${name}`);
      return tool.execute(input, {});
    }
  };
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    enumerable: false,
    value: modelContext
  });
});

const pageCreatedAt = performance.now();
const page = await context.newPage();
page.setDefaultTimeout(options.timeout);
await page.goto(options.url, { waitUntil: "load", timeout: options.timeout });
await page.waitForFunction(() => window.__demoReady === true || Boolean(window.__demoError), null, { timeout: options.timeout });

const demoError = await page.evaluate(() => window.__demoError || null);
if (demoError) throw new Error(demoError);

const durationSeconds = await page.evaluate(() => window.__demoDuration);
const trimStartSeconds = Math.max(0, ((performance.now() - pageCreatedAt) / 1000) - 0.15);
await page.evaluate(() => window.startDemo());
await page.waitForFunction(() => window.__demoDone === true, null, { timeout: (durationSeconds + 30) * 1000 });
await page.waitForTimeout(500);

const video = page.video();
const events = await page.evaluate(() => window.__demoEvents);
await context.close();
const recordedPath = await video.path();
await fs.copyFile(recordedPath, options.output);
await browser.close();

const metadata = {
  sourceUrl: options.url,
  durationSeconds,
  trimStartSeconds,
  viewport: { width: 1920, height: 1080 },
  recordedPath,
  output: options.output,
  events
};
await fs.writeFile(options.metadata, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`);

function parseArguments(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) {
    values[args[index]] = args[index + 1];
  }
  if (!values["--url"] || !values["--output"] || !values["--browser"] || !values["--metadata"]) {
    throw new Error("Usage: record-demo.mjs --url <url> --output <webm> --browser <executable> --metadata <json>");
  }
  return {
    url: values["--url"],
    output: path.resolve(values["--output"]),
    browser: values["--browser"],
    metadata: path.resolve(values["--metadata"]),
    timeout: Number(values["--timeout"] || 45000)
  };
}

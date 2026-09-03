import { existsSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const required = [
  "index.html",
  "css/app-v0.4.css",
  "js/app-v0.4-r9.js",
  "js/config-v0.4.js",
  "js/router-v0.4.js",
  "js/webview-v0.4.js",
  "js/display-controller-v0.4.js",
  "js/webmcp-adapter-v0.4.js",
  "js/background-library-v0.3.js",
  "data/config.json",
  "data/backgrounds.json",
  "api/weather.php",
  "manifest.webmanifest",
  "sw.js",
  "assets/backgrounds/library/towns/town-01.webp",
  "assets/backgrounds/library/resorts/resort-01.webp",
  "assets/backgrounds/library/aurora/aurora-01.webp",
  "assets/backgrounds/PROMPTS.md",
  "web/nara-go/index.html",
  "web/nara-go/simple.html",
  "web/nara-go/assets/styles.css",
  "web/nara-go/assets/app-public.js",
  "web/nara-go/assets/simple.css",
  "web/nara-go/assets/simple-public.js",
  "web/nara-go/data/timetables-public.json",
  "web/nara-go/SOURCE.md",
  "README.md",
  "OPERATIONS.md",
  "CHANGELOG.md",
  "WEBMCP_CHALLENGE.md",
  "submission/devpost-submission-en.md",
  "submission/challenge-demo-narration-en.md",
  "IMPLEMENTATION_REPORT.md",
  "LICENSE",
  "development-report.html"
];

const errors = [];
for (const path of required) {
  const absolute = join(root, path);
  if (!existsSync(absolute) || statSync(absolute).size === 0) errors.push(`missing: ${path}`);
}

const config = JSON.parse(readFileSync(join(root, "data/config.json"), "utf8"));
if (config.defaultScreen !== "ambient") errors.push("defaultScreen must be ambient");
if (config.version !== "0.4.0") errors.push("config version mismatch");
if (!Array.isArray(config.backgrounds) || config.backgrounds.length < 3) errors.push("three ambient backgrounds are required");
if (config.webPages?.[0]?.displayMode !== "iframe") errors.push("NARA/GO copy must use iframe mode");
if (config.webPages?.[0]?.url !== "./web/nara-go/index.html") errors.push("NARA/GO iframe must point to the local copy");

const backgroundCatalog = JSON.parse(readFileSync(join(root, "data/backgrounds.json"), "utf8"));
if (!Array.isArray(backgroundCatalog.categories) || backgroundCatalog.categories.length !== 15) errors.push("fifteen background categories are required");
const acceptedIds = new Set(Array.isArray(backgroundCatalog.acceptedIds) ? backgroundCatalog.acceptedIds : []);
const generatedImages = (backgroundCatalog.sets || []).flatMap((set) => Array.from({ length: set.count || 0 }, (_, index) => {
  const sequence = String(index + 1).padStart(2, "0");
  const id = `${set.prefix}-${sequence}`;
  return {
    id,
    category: set.category,
    src: `./assets/backgrounds/library/${set.directory}/${id}.webp`,
    thumbnail: `./assets/backgrounds/thumbnails/${id}.webp`,
    defaultStatus: acceptedIds.has(id) ? "accepted" : set.defaultStatus || "candidate"
  };
}));
const seenSources = new Set();
const catalogImages = [...(backgroundCatalog.images || []), ...generatedImages].filter((image) => {
  if (seenSources.has(image.src)) return false;
  seenSources.add(image.src);
  return true;
});
if (!Array.isArray(backgroundCatalog.sets) || backgroundCatalog.sets.length !== 14) errors.push("fourteen generated background sets are required");
if (catalogImages.length !== 95) errors.push("95 unique catalog images are required");
if (catalogImages.filter((image) => image.defaultStatus === "accepted").length !== 3) errors.push("three default accepted images are required");
const animatedImages = generatedImages.filter((image) => image.category === "aurora-motion");
if (animatedImages.length !== 3) errors.push("three animated aurora images are required");
const animatedSet = backgroundCatalog.sets.find((set) => set.category === "aurora-motion");
if (animatedSet?.presentation !== "aurora") errors.push("animated aurora presentation mode is required");
const backgroundIds = new Set();
for (const image of catalogImages) {
  if (!image.id || backgroundIds.has(image.id)) errors.push(`duplicate or missing background id: ${image.id || "unknown"}`);
  backgroundIds.add(image.id);
  for (const asset of [image.src, image.thumbnail]) {
    if (typeof asset !== "string" || !asset.startsWith("./")) {
      errors.push(`invalid background asset path: ${image.id}`);
      continue;
    }
    const path = asset.slice(2);
    if (!existsSync(join(root, path)) || statSync(join(root, path)).size === 0) errors.push(`missing background asset: ${path}`);
  }
}

const publicTimetablePath = join(root, "web/nara-go/data/timetables-public.json");
const publicTimetableText = readFileSync(publicTimetablePath, "utf8");
const publicTimetable = JSON.parse(publicTimetableText);
if (publicTimetable.dataset !== "synthetic-challenge-sample") errors.push("public timetable must be the synthetic challenge sample");
if (typeof publicTimetable.warning !== "string" || !publicTimetable.warning.trim()) errors.push("public timetable warning is required");
for (const [label, value] of [
  ["verified", publicTimetable.verified],
  ["narakotsu revision", publicTimetable.narakotsu?.revision],
  ["kashibus revision", publicTimetable.kashibus?.revision]
]) {
  if (value !== "2026-09-03") errors.push(`${label} must match the public sample release date`);
}

const index = readFileSync(join(root, "index.html"), "utf8");
if (!index.includes('data-screen="ambient"')) errors.push("ambient screen missing");
if (!index.includes('data-screen="weather"')) errors.push("weather screen missing");
if (!index.includes('data-screen="web"')) errors.push("web screen missing");
if (!index.includes('data-screen="information-os"')) errors.push("Information OS screen missing");
if (!index.includes('data-screen="information"')) errors.push("Agent information screen missing");
if (!index.includes('id="agent-activity"')) errors.push("Agent Activity UI missing");
if (!index.includes('id="webmcp-debug"') || !index.includes('hidden aria-label="WebMCP Debug"')) errors.push("WebMCP debug UI must be hidden by default");
if (!index.includes('id="ambient-type"')) errors.push("ambient type selector missing");
if (!index.includes('id="background-grid"')) errors.push("background review grid missing");
if (!index.includes('id="background-preview"')) errors.push("background preview dialog missing");
if (!index.includes('href="https://open-meteo.com/"') || !index.includes("Weather data by Open-Meteo.com")) errors.push("visible Open-Meteo attribution link missing");

const normalCopy = readFileSync(join(root, "web/nara-go/index.html"), "utf8");
const simpleCopy = readFileSync(join(root, "web/nara-go/simple.html"), "utf8");
if (!normalCopy.includes('href="./simple.html"')) errors.push("normal to simple mode switch missing");
if (!simpleCopy.includes('href="./"')) errors.push("simple to normal mode switch missing");
if (!normalCopy.includes('./assets/app-public.js?v=20260903-r10')) errors.push("normal public consumer path missing");
if (!simpleCopy.includes('./assets/simple-public.js?v=20260903-r10')) errors.push("simple public consumer path missing");

const sourceFiles = [
  "js/app-v0.4-r9.js", "js/config-v0.4.js", "js/router-v0.4.js", "js/gestures.js", "js/ambient-v0.3.js", "js/weather.js", "js/webview-v0.4.js", "js/display-controller-v0.4.js", "js/webmcp-adapter-v0.4.js", "js/background-library-v0.3.js", "sw.js",
  "web/nara-go/assets/app-public.js", "web/nara-go/assets/simple-public.js", "web/nara-go/assets/embed.js"
];
for (const path of sourceFiles) {
  const result = spawnSync(process.execPath, ["--check", join(root, path)], { encoding: "utf8" });
  if (result.status !== 0) errors.push(`syntax: ${path}: ${(result.stderr || result.stdout).trim()}`);
}

const publicNaraGoSources = ["web/nara-go/assets/app-public.js", "web/nara-go/assets/simple-public.js"]
  .map((path) => readFileSync(join(root, path), "utf8"))
  .join("\n");
if (!publicNaraGoSources.includes("Public build refused non-synthetic timetable data")) errors.push("public timetable consumer must fail closed");

const serviceWorker = readFileSync(join(root, "sw.js"), "utf8");
if (!serviceWorker.includes('CACHE_NAME = "tama-info-v0.4.0-r11-final"')) errors.push("final release cache name missing");
if (serviceWorker.includes("caches.match(request")) errors.push("service worker must not search stale caches across releases");

const ambientController = readFileSync(join(root, "js/ambient-v0.3.js"), "utf8");
if (!ambientController.includes("backgroundRequestRevision")) errors.push("ambient background race guard missing");

const adapter = readFileSync(join(root, "js/webmcp-adapter-v0.4.js"), "utf8");
if (!adapter.includes('documentRef?.modelContext')) errors.push("WebMCP feature detection missing");
if (!adapter.includes("Promise.allSettled")) errors.push("WebMCP registration failures must be isolated");
for (const name of ["get_display_status", "set_display_mode", "open_web_page", "show_information", "show_weather", "show_ambient", "undo_last_display_action"]) {
  if (!adapter.includes(`name: "${name}"`)) errors.push(`WebMCP tool missing: ${name}`);
}

const displayController = readFileSync(join(root, "js/display-controller-v0.4.js"), "utf8");
if (!displayController.includes("manual_state_preserved")) errors.push("manual priority guard missing");
if (!displayController.includes("textContent = message")) errors.push("information message must use textContent");

const textToScan = required
  .filter((path) => /\.(?:html|js|json|php|md)$/.test(path) && existsSync(join(root, path)))
  .map((path) => readFileSync(join(root, path), "utf8"))
  .join("\n");
if (/sk-[A-Za-z0-9_-]{20,}/.test(textToScan)) errors.push("possible API key detected");

if (errors.length) {
  console.error("VERIFY_FAILED");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`VERIFY_OK (${required.length} required files, ${sourceFiles.length} JavaScript syntax checks)`);
console.log(`Root: ${relative(process.cwd(), root) || "."}`);

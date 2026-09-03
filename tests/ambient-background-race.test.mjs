import test from "node:test";
import assert from "node:assert/strict";
import { AmbientController } from "../js/ambient-v0.3.js";

function createLayer() {
  const classes = new Set();
  return {
    style: {
      backgroundImage: "",
      setProperty() {}
    },
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      }
    }
  };
}

test("後着した古い背景読込が選択済みAmbientタイプを上書きしない", () => {
  const originalDocument = globalThis.document;
  const originalImage = globalThis.Image;
  const originalWindow = globalThis.window;
  const layers = [createLayer(), createLayer()];
  layers[0].classList.add("is-visible");
  const typeLabel = { textContent: "" };
  const images = [];

  globalThis.document = {
    querySelectorAll: (selector) => selector === "[data-background-layer]" ? layers : [],
    querySelector: (selector) => selector === "#ambient-type-label" ? typeLabel : { style: { setProperty() {} } }
  };
  globalThis.Image = class {
    constructor() { images.push(this); }
    set src(value) { this.value = value; }
  };
  globalThis.window = { clearTimeout() {}, setTimeout() { return 1; } };

  try {
    const ambient = new AmbientController({
      backgrounds: ["./assets/backgrounds/library/aurora/aurora-01.webp"],
      backgroundChangeMinutes: 15,
      pixelShiftSeconds: 120
    });
    ambient.changeBackground();
    ambient.setLibrary({
      categories: [{ id: "towns", label: "世界の町並み" }],
      images: [{
        id: "town-01",
        category: "towns",
        src: "./assets/backgrounds/library/towns/town-01.webp",
        defaultStatus: "accepted"
      }]
    }, "towns", {});

    assert.equal(images.length, 2);
    images[1].onload();
    images[0].onload();
    assert.equal(ambient.backgroundId, "town-01");
    assert.equal(typeLabel.textContent, "AMBIENT · 世界の町並み");
    assert.match(layers[1].style.backgroundImage, /town-01\.webp/);
  } finally {
    globalThis.document = originalDocument;
    globalThis.Image = originalImage;
    globalThis.window = originalWindow;
  }
});

export class ScreenRouter extends EventTarget {
  constructor(root, { mainScreens = ["ambient", "weather", "web"], defaultScreen = "ambient" } = {}) {
    super();
    this.root = root;
    this.mainScreens = mainScreens;
    this.defaultScreen = defaultScreen;
    this.screens = new Map(
      [...document.querySelectorAll("[data-screen]")]
        .filter((element) => element.classList.contains("screen"))
        .map((element) => [element.dataset.screen, element])
    );
    this.current = null;
    this.history = [];
  }

  start() {
    const initial = this.screens.has(this.defaultScreen) ? this.defaultScreen : "ambient";
    this.go(initial, { record: false, reason: "startup", source: "automatic" });
  }

  go(target, { record = true, reason = "navigation", source = "automatic" } = {}) {
    if (!this.screens.has(target) || target === this.current) return false;
    const previous = this.current;
    if (record && previous) this.history.push(previous);
    this.current = target;
    this.root.dataset.screen = target;

    for (const [name, screen] of this.screens) {
      const active = name === target;
      screen.classList.toggle("is-active", active);
      screen.setAttribute("aria-hidden", String(!active));
      if (active) screen.scrollTop = 0;
    }

    for (const control of document.querySelectorAll("[data-route]")) {
      const active = control.dataset.route === target;
      control.classList.toggle("is-current", active);
      if (control.closest(".screen-rail")) control.setAttribute("aria-current", active ? "page" : "false");
    }

    this.dispatchEvent(new CustomEvent("change", { detail: { current: target, previous, reason, source } }));
    return true;
  }

  next({ source = "human" } = {}) {
    const index = this.mainScreens.indexOf(this.current);
    const base = index >= 0 ? index : 0;
    return this.go(this.mainScreens[(base + 1) % this.mainScreens.length], { reason: "swipe-left", source });
  }

  previous({ source = "human" } = {}) {
    const index = this.mainScreens.indexOf(this.current);
    const base = index >= 0 ? index : 0;
    return this.go(this.mainScreens[(base - 1 + this.mainScreens.length) % this.mainScreens.length], { reason: "swipe-right", source });
  }

  openOS({ source = "human" } = {}) {
    return this.go("information-os", { reason: "swipe-up", source });
  }

  back({ source = "human" } = {}) {
    while (this.history.length) {
      const target = this.history.pop();
      if (target !== this.current && this.screens.has(target)) {
        return this.go(target, { record: false, reason: "back", source });
      }
    }
    return this.go("ambient", { record: false, reason: "back-home", source });
  }
}

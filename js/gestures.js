const DEFAULTS = Object.freeze({ minDistance: 72, maxDuration: 700, axisRatio: 1.35 });

export class GestureController {
  constructor(element, handlers, options = {}) {
    this.element = element;
    this.handlers = handlers;
    this.options = { ...DEFAULTS, ...options };
    this.startPoint = null;
    this.pointerId = null;
    this.bind();
  }

  bind() {
    this.element.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    this.element.addEventListener("pointerup", (event) => this.onPointerUp(event));
    this.element.addEventListener("pointercancel", () => this.reset());
  }

  isLockedTarget(target) {
    return Boolean(target.closest("[data-gesture-lock], input, select, textarea, iframe, a, button"));
  }

  onPointerDown(event) {
    if (!event.isPrimary || event.button > 0 || this.isLockedTarget(event.target)) return;
    this.pointerId = event.pointerId;
    this.startPoint = { x: event.clientX, y: event.clientY, time: performance.now() };
    try { this.element.setPointerCapture(event.pointerId); } catch { /* not required */ }
  }

  onPointerUp(event) {
    if (!this.startPoint || event.pointerId !== this.pointerId) return;
    const elapsed = performance.now() - this.startPoint.time;
    const dx = event.clientX - this.startPoint.x;
    const dy = event.clientY - this.startPoint.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    this.reset();

    if (elapsed > this.options.maxDuration) return;
    if (absX >= this.options.minDistance && absX >= absY * this.options.axisRatio) {
      this.handlers[dx < 0 ? "left" : "right"]?.();
      return;
    }
    if (absY >= this.options.minDistance && absY >= absX * this.options.axisRatio) {
      this.handlers[dy < 0 ? "up" : "down"]?.();
    }
  }

  reset() {
    this.startPoint = null;
    this.pointerId = null;
  }
}

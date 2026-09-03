import { saveRuntimeSettings } from "./config-v0.3.js";

const STATUSES = ["candidate", "accepted", "rejected"];
const STATUS_LABELS = Object.freeze({ candidate: "候補", accepted: "採用", rejected: "不採用" });

export class BackgroundLibraryController {
  constructor(config, ambient, notify = () => {}) {
    this.config = config;
    this.ambient = ambient;
    this.notify = notify;
    this.catalog = config.backgroundCatalog;
    this.decisions = { ...config.backgroundDecisions };
    this.ambientType = config.ambientType;
    this.statusFilter = "all";
    this.categoryFilter = "all";
    this.previewId = null;
    this.grid = document.querySelector("#background-grid");
    this.dialog = document.querySelector("#background-preview");
  }

  start() {
    this.populateCategoryControls();
    this.bindControls();
    this.ambient.setLibrary(this.catalog, this.ambientType, this.decisions);
    this.render();
  }

  get categories() {
    return Array.isArray(this.catalog?.categories) ? this.catalog.categories : [];
  }

  get images() {
    return Array.isArray(this.catalog?.images) ? this.catalog.images : [];
  }

  categoryLabel(id) {
    return this.categories.find((category) => category.id === id)?.label || id;
  }

  statusFor(image) {
    const override = this.decisions[image.id];
    return STATUSES.includes(override) ? override : image.defaultStatus || "candidate";
  }

  populateCategoryControls() {
    const typeSelect = document.querySelector("#ambient-type");
    const filterSelect = document.querySelector("#library-category");
    typeSelect.replaceChildren(new Option("採用済みミックス", "all"));
    filterSelect.replaceChildren(new Option("すべてのタイプ", "all"));
    for (const category of this.categories) {
      typeSelect.add(new Option(category.label, category.id));
      filterSelect.add(new Option(category.label, category.id));
    }
    typeSelect.value = this.ambientType;
    if (!typeSelect.value) {
      this.ambientType = "all";
      typeSelect.value = "all";
    }
  }

  bindControls() {
    document.querySelector("#ambient-type").addEventListener("change", (event) => {
      this.ambientType = event.target.value;
      saveRuntimeSettings({ ambientType: this.ambientType });
      this.ambient.setAmbientType(this.ambientType);
      this.updateSummary();
      const label = this.ambientType === "all" ? "採用済みミックス" : this.categoryLabel(this.ambientType);
      this.notify(`Ambientタイプを「${label}」に変更しました`);
    });

    document.querySelector("#library-category").addEventListener("change", (event) => {
      this.categoryFilter = event.target.value;
      this.renderCards();
    });

    document.querySelectorAll("[data-library-status]").forEach((button) => {
      button.addEventListener("click", () => {
        this.statusFilter = button.dataset.libraryStatus;
        document.querySelectorAll("[data-library-status]").forEach((control) => {
          control.setAttribute("aria-pressed", String(control === button));
        });
        this.renderCards();
      });
    });

    this.grid.addEventListener("click", (event) => {
      const statusButton = event.target.closest("[data-image-status]");
      if (statusButton) {
        this.setStatus(statusButton.dataset.imageId, statusButton.dataset.imageStatus);
        return;
      }
      const previewButton = event.target.closest("[data-preview-id]");
      if (previewButton) this.openPreview(previewButton.dataset.previewId);
    });

    document.querySelector("#background-preview-close").addEventListener("click", () => this.dialog.close());
    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });
    document.querySelectorAll("[data-preview-status]").forEach((button) => {
      button.addEventListener("click", () => this.setStatus(this.previewId, button.dataset.previewStatus));
    });
  }

  setStatus(id, status) {
    if (!id || !STATUSES.includes(status) || !this.images.some((image) => image.id === id)) return;
    this.decisions[id] = status;
    saveRuntimeSettings({ backgroundDecisions: this.decisions });
    this.ambient.setImageDecisions(this.decisions);
    this.render();
    this.updatePreviewState();
    const image = this.images.find((item) => item.id === id);
    this.notify(`「${image.title}」を${STATUS_LABELS[status]}にしました`);
  }

  render() {
    this.updateCounts();
    this.updateSummary();
    this.renderCards();
  }

  updateCounts() {
    const counts = { all: this.images.length, candidate: 0, accepted: 0, rejected: 0 };
    for (const image of this.images) counts[this.statusFor(image)] += 1;
    for (const [status, count] of Object.entries(counts)) {
      const element = document.querySelector(`#status-count-${status}`);
      if (element) element.textContent = String(count);
    }
    document.querySelector("#background-library-total").textContent = `${this.images.length} IMAGES`;
  }

  updateSummary() {
    const selected = this.images.filter((image) => {
      const categoryMatch = this.ambientType === "all" || image.category === this.ambientType;
      return categoryMatch && this.statusFor(image) === "accepted";
    });
    const summary = document.querySelector("#ambient-type-summary");
    if (selected.length) {
      summary.textContent = `採用済み ${selected.length}枚から表示します。`;
      summary.classList.remove("is-warning");
    } else {
      summary.textContent = "このタイプには採用済み画像がないため、採用済みミックスを表示します。";
      summary.classList.add("is-warning");
    }
  }

  renderCards() {
    const visible = this.images.filter((image) => {
      const status = this.statusFor(image);
      const statusMatch = this.statusFilter === "all" || status === this.statusFilter;
      const categoryMatch = this.categoryFilter === "all" || image.category === this.categoryFilter;
      return statusMatch && categoryMatch;
    });

    this.grid.replaceChildren(...visible.map((image) => this.createCard(image)));
    document.querySelector("#background-library-empty").hidden = visible.length > 0;
  }

  createCard(image) {
    const status = this.statusFor(image);
    const card = document.createElement("article");
    card.className = `background-card is-${status}`;

    const preview = document.createElement("button");
    preview.type = "button";
    preview.className = "background-card__preview";
    preview.dataset.previewId = image.id;
    preview.setAttribute("aria-label", `${image.title}を拡大表示`);
    const img = document.createElement("img");
    img.src = image.thumbnail || image.src;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    preview.append(img);

    const body = document.createElement("div");
    body.className = "background-card__body";
    const meta = document.createElement("div");
    meta.className = "background-card__meta";
    const category = document.createElement("span");
    category.textContent = this.categoryLabel(image.category);
    const statusChip = document.createElement("span");
    statusChip.className = `status-chip status-chip--${status}`;
    statusChip.textContent = STATUS_LABELS[status];
    meta.append(category);
    if (image.presentation === "aurora") {
      const motionChip = document.createElement("span");
      motionChip.className = "motion-chip";
      motionChip.textContent = "MOTION";
      meta.append(motionChip);
    }
    meta.append(statusChip);
    const title = document.createElement("h3");
    title.textContent = image.title;
    const actions = document.createElement("div");
    actions.className = "review-actions review-actions--card";
    actions.setAttribute("role", "group");
    actions.setAttribute("aria-label", `${image.title}の審査状態`);
    for (const value of STATUSES) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.imageId = image.id;
      button.dataset.imageStatus = value;
      button.textContent = STATUS_LABELS[value];
      button.setAttribute("aria-pressed", String(value === status));
      actions.append(button);
    }
    body.append(meta, title, actions);
    card.append(preview, body);
    return card;
  }

  openPreview(id) {
    const image = this.images.find((item) => item.id === id);
    if (!image) return;
    this.previewId = id;
    const preview = document.querySelector("#background-preview-image");
    preview.src = image.src;
    preview.alt = `${image.title}のプレビュー`;
    document.querySelector("#background-preview-category").textContent = `${this.categoryLabel(image.category)}${image.presentation === "aurora" ? " · MOTION" : ""}`;
    document.querySelector("#background-preview-title").textContent = image.title;
    document.querySelector("#background-preview-description").textContent = image.description || "";
    this.updatePreviewState();
    this.dialog.showModal();
  }

  updatePreviewState() {
    const image = this.images.find((item) => item.id === this.previewId);
    if (!image) return;
    const status = this.statusFor(image);
    document.querySelectorAll("[data-preview-status]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.previewStatus === status));
    });
  }
}

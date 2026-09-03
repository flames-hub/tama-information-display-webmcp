export class WebViewController {
  constructor(pages = [], { locationRef = globalThis.location } = {}) {
    this.pages = pages;
    this.location = locationRef;
    this.currentPage = null;
    this.container = document.querySelector("#web-pages");
  }

  render() {
    this.container.replaceChildren();
    this.container.classList.remove("has-iframe");
    const visiblePages = this.currentPage ? [this.currentPage] : this.pages;
    if (!visiblePages.length) {
      const empty = document.createElement("p");
      empty.className = "web-empty";
      empty.textContent = "登録されたWebページはありません。";
      this.container.append(empty);
      return;
    }

    visiblePages.forEach((page, index) => {
      const article = document.createElement("article");
      article.className = "web-card";
      const meta = document.createElement("div");
      meta.className = "web-card__meta";
      const number = document.createElement("span");
      number.textContent = String(index + 1).padStart(2, "0");
      const status = document.createElement("span");
      status.className = "web-card__status";
      status.textContent = page.displayMode === "iframe" ? "EMBEDDED" : "EXTERNAL VIEW";
      meta.append(number, status);

      const title = document.createElement("h2");
      title.textContent = page.name || "Web page";
      const description = document.createElement("p");
      description.textContent = page.description || "";
      const hostname = document.createElement("span");
      hostname.className = "web-card__host";
      try { hostname.textContent = new URL(page.url).hostname; } catch { hostname.textContent = "URL未設定"; }

      if (page.displayMode === "iframe") {
        this.container.classList.add("has-iframe");
        const frameHeader = document.createElement("div");
        frameHeader.className = "web-frame-header";
        const frameIdentity = document.createElement("div");
        frameIdentity.className = "web-frame-header__identity";
        frameIdentity.append(title, description);
        const source = document.createElement("a");
        source.className = "quiet-link";
        source.href = page.sourceUrl || page.url;
        source.target = "_blank";
        source.rel = "noopener noreferrer";
        source.textContent = "オリジナルを開く ↗";
        frameHeader.append(meta, frameIdentity, source);
        const frame = document.createElement("iframe");
        frame.src = page.url;
        frame.title = page.name || "Web page";
        frame.loading = "lazy";
        frame.referrerPolicy = "strict-origin-when-cross-origin";
        frame.sandbox = "allow-scripts allow-forms allow-same-origin allow-popups allow-modals";
        frame.allowFullscreen = true;
        frame.setAttribute("data-gesture-lock", "");
        article.classList.add("web-card--iframe");
        article.append(frameHeader, frame);
      } else {
        const actions = document.createElement("div");
        actions.className = "web-card__actions";
        const launch = document.createElement("a");
        launch.className = "launch-button";
        launch.href = page.url;
        launch.target = "_blank";
        launch.rel = "noopener noreferrer";
        launch.textContent = `${page.name || "ページ"}を開く`;
        const sameTab = document.createElement("a");
        sameTab.className = "quiet-link";
        sameTab.href = page.url;
        sameTab.textContent = "この画面で開く";
        actions.append(launch, sameTab);
        article.append(meta, title, description, hostname, actions);
        if (page.statusNote) {
          const note = document.createElement("p");
          note.className = "web-card__note";
          note.textContent = page.statusNote;
          article.append(note);
        }
      }
      this.container.append(article);
    });
  }

  openPage({ url, title = "" }) {
    let target;
    try {
      target = new URL(url, this.location.href);
    } catch {
      throw inputError("url", "有効なURLを指定してください");
    }
    if (!["http:", "https:"].includes(target.protocol)) {
      throw inputError("url", "httpまたはhttpsのURLを指定してください");
    }

    const resolved = this.resolveConfiguredPage(target);
    if (!resolved) throw inputError("url", "このURLはWeb表示の許可リストに含まれていません");
    this.currentPage = {
      ...resolved.page,
      name: title || resolved.page.name || "Web page",
      description: resolved.page.description || "Agentから開いた許可済みページ",
      url: resolved.localUrl,
      sourceUrl: target.href,
      displayMode: "iframe",
      agentRequested: true
    };
    this.render();
    return this.getCurrentPageStatus();
  }

  resolveConfiguredPage(target) {
    for (const page of this.pages) {
      if (page.displayMode !== "iframe" || !page.url) continue;
      const localUrl = new URL(page.url, this.location.href);
      const localBase = new URL(".", localUrl);
      const sourceBase = page.sourceUrl ? new URL(page.sourceUrl, this.location.href) : null;
      const suffix = relativeAllowedPage(target, sourceBase) ?? relativeAllowedPage(target, localBase);
      if (suffix === null) continue;
      return { page, localUrl: new URL(suffix || "index.html", localBase).href };
    }
    return null;
  }

  getState() {
    return { currentPage: this.currentPage ? { ...this.currentPage } : null };
  }

  restoreState(state = {}) {
    this.currentPage = state.currentPage ? { ...state.currentPage } : null;
    this.render();
  }

  getCurrentPageStatus() {
    const page = this.currentPage || this.pages.find((item) => item.displayMode === "iframe") || this.pages[0];
    if (!page) return null;
    return {
      id: page.id || null,
      title: page.name || "Web page",
      url: page.url,
      source_url: page.sourceUrl || page.url,
      display_mode: page.displayMode || "external",
      agent_requested: Boolean(page.agentRequested)
    };
  }
}

function relativeAllowedPage(target, base) {
  if (!base || target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) return null;
  const suffix = target.pathname.slice(base.pathname.length).replace(/^\/+/, "");
  if (!["", "index.html", "simple.html"].includes(suffix)) return null;
  return suffix;
}

function inputError(field, message) {
  const error = new TypeError(message);
  error.code = "invalid_input";
  error.field = field;
  return error;
}

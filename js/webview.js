export class WebViewController {
  constructor(pages = []) {
    this.pages = pages;
    this.container = document.querySelector("#web-pages");
  }

  render() {
    this.container.replaceChildren();
    this.container.classList.remove("has-iframe");
    if (!this.pages.length) {
      const empty = document.createElement("p");
      empty.className = "web-empty";
      empty.textContent = "登録されたWebページはありません。";
      this.container.append(empty);
      return;
    }

    this.pages.forEach((page, index) => {
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
}

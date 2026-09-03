import test from "node:test";
import assert from "node:assert/strict";
import { WebViewController } from "../js/webview-v0.4.js";

function createWebView() {
  const controller = Object.create(WebViewController.prototype);
  controller.location = new URL("https://example.test/tama-info/");
  controller.pages = [{
    id: "nara-go",
    name: "NARA/GO",
    url: "./web/nara-go/index.html",
    sourceUrl: "https://tama-hub.xvps.jp/nara-go/",
    displayMode: "iframe"
  }];
  controller.currentPage = null;
  return controller;
}

test("設定済みsourceUrlのsimple.htmlをローカルコピーへ写像する", () => {
  const controller = createWebView();
  const result = controller.resolveConfiguredPage(new URL("https://tama-hub.xvps.jp/nara-go/simple.html"));
  assert.equal(result.localUrl, "https://example.test/tama-info/web/nara-go/simple.html");
});

test("未登録originと危険なschemeを拒否する", () => {
  const controller = createWebView();
  assert.equal(controller.resolveConfiguredPage(new URL("https://untrusted.example/page")), null);
  assert.throws(() => controller.openPage({ url: "javascript:alert(1)" }), /httpまたはhttps/);
  assert.throws(() => controller.openPage({ url: "data:text/html,test" }), /httpまたはhttps/);
});

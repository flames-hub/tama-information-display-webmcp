# TAMA Information Display — WebMCP Challenge

## 狙い

TAMA Information Displayは、Ambient、天気、Web、お知らせを常設画面へ表示します。Challenge対応は通常UIの置換ではなく、既存のApplication LogicをAgentからも利用できる追加Adapterです。

API形状は2026-09-03時点の[WebMCP W3C Community Group draft](https://github.com/webmachinelearning/webmcp)と[OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/)を基準にしています。

## 実装境界

```text
Human UI ─┐
          ├─ DisplayController ─ Router / Ambient / Weather / WebView / DOM State
WebMCP ───┘
```

- WebMCP固有コードは`js/webmcp-adapter-v0.4.js`に隔離する。
- Adapterを読み込まない構成でも、Human UIと各Controllerは成立する。
- `document.modelContext`または`registerTool`がなければ何も登録しない。
- 登録は`Promise.allSettled()`でTool単位に隔離し、失敗を通常UIへ伝播させない。
- ToolはDOMクリックを模倣せず、Human UIと同じ`DisplayController`へ委譲する。
- 任意文字列は`textContent`だけで表示し、長さ・enum・数値範囲を検証する。

## Tool契約

| Name | Input | Outputの要点 |
| --- | --- | --- |
| `get_display_status` | `{}` | `current_mode`, `control_owner`, Ambient / Weather / Web / last action |
| `set_display_mode` | `{mode}` | 実際に切り替えた`current_mode` |
| `open_web_page` | `{url,title?}` | 許可済み同一オリジンコピーの表示状態 |
| `show_information` | `{title,message,priority?,duration_seconds?}` | Information画面、Action ID、Undo可否 |
| `show_weather` | `{location?}` | 要求地点と実表示地点。v0.4の実データ地点は奈良市 |
| `show_ambient` | `{}` | Ambientと利用者が選択済みのタイプ |
| `undo_last_display_action` | `{}` | 直前のAgent操作の復帰結果 |

`open_web_page`は`http:` / `https:`だけを受け付け、さらに`data/config.json`で登録されたiframeページのローカルURLまたは`sourceUrl`配下に限定します。NARA/GOは`index.html`と`simple.html`だけを、`web/nara-go/`のコピーへ写像します。`javascript:`、`data:`、`file:`、未登録originは拒否します。

## Human-Agent優先順位

```text
Human manual operation > Agent operation > Automatic/default state
```

Agent操作直前の画面、Web表示、Information内容をスナップショットに保存します。Undoまたは`duration_seconds`終了時は、Agent操作後に手動操作がない場合だけ復帰します。人間のタップ、キー、スワイプ、設定変更、埋め込みNARA/GO内の操作を検知した時点でAgent操作を無効化し、`manual_state_preserved`を返します。Agentが現在の表示主体である間、通常の無操作Ambient復帰も待機します。

## Agent Activity / Debug

Agent ActivityはAgentが操作した後だけ画面右下（狭い画面では下部ナビ上）に現れます。内容、時刻、Undoだけを表示し、画面全体を覆いません。人間が操作するとUndoを無効にして手動優先を明示します。

Debug UIは標準で`hidden`です。`?webmcp-debug=1`でのみ、WebMCP可否、登録Tool数、Remote状態を表示します。

## Remote Display

v0.4では`remote_sync: disabled`です。既存環境に共有認証・競合解決・表示ID管理がないため、ポーリングや外部状態の自動適用は追加していません。将来実装する場合も次を必須とします。

1. Display側で明示的に有効化する。
2. revisionと操作主体を持ち、手動revisionより古いAgent状態を拒否する。
3. 通常起動時は通信しない。
4. 切断・認証失敗時はローカルHuman UIだけで成立する。

## 確認方法

```powershell
npm run verify
php -l api/weather.php
php -S 127.0.0.1:8787 -t .
```

通常ブラウザで基本UIとコンソールを確認します。WebMCP Adapterの契約はNodeのtest hostで、非対応、7 Tool登録、登録全失敗、手動優先Undoを検証します。公開後はChatGPT in-app browserで7 Toolのネイティブ登録とWeather / Web / Information / Ambientの可視変更を確認済みです。

## Challenge提出前チェック

- [x] WebMCP Adapterと7 Tool
- [x] 実UI反映、Agent Activity、Undo
- [x] 非対応ブラウザと登録失敗の隔離
- [x] 入力検証、URL allowlist、`textContent`
- [x] README、MIT LICENSE、Challenge文書、Devpost文、3分台本
- [x] v0.4の本番デプロイと公開URL実測
- [ ] GitHubリポジトリのpublic化（clean history準備済み）
- [x] ChatGPT in-app browserでのネイティブTool実測
- [x] WebMCP非対応Chromeで通常UIが継続することを実測

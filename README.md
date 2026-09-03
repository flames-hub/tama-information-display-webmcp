# TAMA Information Display

普段は美しいAmbient Display、触るとInformation OS。13.3インチ4K OLEDタッチディスプレイを、毎日使える静かな情報面へ変えるWebアプリです。WebMCP対応ブラウザでは、同じ画面操作をAgentから意味のあるToolとして利用できます。

- Version: `0.4.0`
- Live Demo: <https://tama-hub.xvps.jp/tama-info/>
- Public Challenge Source: <https://github.com/flames-hub/tama-information-display-webmcp>
- Stack: HTML / CSS / JavaScript / PHP
- Runtime dependency: なし

## WebMCP Challenge

> Public-source boundary: the bundled NARA/GO timetable is synthetic demonstration data, and three earlier backgrounds without repository-local provenance are excluded. See [ASSET_AND_DATA_NOTICES.md](./ASSET_AND_DATA_NOTICES.md).

### What is TAMA Information Display?

離れて置かれた常設ディスプレイを、静かなAmbient、天気、Webページ、短いお知らせへ切り替える表示アプリです。通常UIだけで全機能が成立し、WebMCPは既存操作の上に載る任意のAdapterです。

### WebMCP

対応環境では`document.modelContext.registerTool()`で7つのToolを登録します。非対応環境では登録を安全にスキップし、登録失敗も通常UIから隔離します。AgentはDOMを推測してクリックせず、既存Router / Weather / WebView / Ambientへ委譲する`DisplayController`を呼びます。

実装は[WebMCP W3C Community Group draft](https://github.com/webmachinelearning/webmcp)のimperative APIと、[OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/)の案内を2026-09-03時点で確認しています。

操作優先順位は `Human manual operation > Agent operation > Automatic/default state` です。Agent操作後に人間が触れた場合、時間指定の復帰とUndoはその手動状態を上書きしません。Remote Display同期は、不要な通信や上書きを避けるためv0.4では無効です。

### Available Tools

| Tool | Input | UIへの効果 |
| --- | --- | --- |
| `get_display_status` | なし | 現在画面、操作主体、Ambient、Web、直前操作を返す（読み取り専用） |
| `set_display_mode` | `mode` | Ambient / Weather / Web / Informationへ既存Routerで切替 |
| `open_web_page` | `url`, `title?` | 許可済みNARA/GO URLをローカルコピーのWeb画面へ表示 |
| `show_information` | `title`, `message`, `priority?`, `duration_seconds?` | 任意のお知らせを専用画面へ安全なテキストとして表示 |
| `show_weather` | `location?` | 既存Weatherを表示・更新。要求地点と実表示地点を区別して返す |
| `show_ambient` | なし | 利用者が選択済みのAmbientタイプへ戻す |
| `undo_last_display_action` | なし | 手動操作が挟まっていない直前のAgent操作だけを元に戻す |

### Architecture

```text
Existing Application
├─ Human UI ───────────────┐
├─ DisplayController       │  shared application facade
│  ├─ ScreenRouter         │
│  ├─ AmbientController    │
│  ├─ WeatherController    │
│  └─ WebViewController    │
└─ Local State             │
                           │
WebMCP Adapter ────────────┘  optional / feature-detected / removable
```

### Demo Prompts

- 「現在のディスプレイ状態を確認して」
- 「Weather画面に切り替えて」
- 「NARA/GOのシンプル表示を開いて」
- 「『10時から会議です』と30秒間表示して」
- 「Ambientへ戻して」
- 「直前のディスプレイ操作を元に戻して」

### Challenge Work

WebMCP Adapter、共有DisplayController、Information画面、Agent Activity、手動優先Undo、入力検証、非対応・登録失敗テスト、Challenge文書をv0.4で追加しました。詳細は[WEBMCP_CHALLENGE.md](./WEBMCP_CHALLENGE.md)を参照してください。

### Setup

ローカル起動と検証は後述の「ローカル開発」を参照してください。Debug UIは通常非表示で、`?webmcp-debug=1`を付けた場合だけ登録状態を表示します。

### License

MIT Licenseです。[LICENSE](./LICENSE)を参照してください。

## 画面と操作

| 操作 | 動作 |
| --- | --- |
| 左フリック / `→` | Ambient → Weather → Web |
| 右フリック / `←` | 逆方向へ移動 |
| 上フリック / `↑` | Information OSを開く |
| 下フリック / `↓` / `Esc` | ひとつ前へ戻る |
| タップ / クリック | タイル・ボタンを選択 |
| 5分無操作 | Ambientへ自動復帰 |

設定画面でAmbientタイプ、背景画像の候補・採用・不採用、Ambient復帰時間、背景切替間隔を端末ごとに変更できます。設定値はブラウザの`localStorage`へ保存します。

## ディレクトリ

```text
.
├─ index.html                 # アプリシェル
├─ css/app-v0.4.css           # OLED UI、Information、Agent Activity
├─ js/                        # Router / Gesture / Ambient / Weather / Web
├─ api/weather.php            # Open-Meteoサーバー側プロキシ
├─ assets/backgrounds/        # 4K WebPローカル背景
├─ data/config.json           # 主要設定とWebページ定義
├─ data/backgrounds.json      # 背景カタログ、分類、初期審査状態
├─ web/nara-go/               # Information Display専用NARA/GOコピー
├─ manifest.webmanifest       # PWAメタデータ
├─ sw.js                      # オフライン用静的キャッシュ
├─ WEBMCP_CHALLENGE.md        # Tool設計、境界、テスト手順
├─ OPERATIONS.md              # 常設運用・デプロイ手順
└─ development-report.html    # 開発レポート
```

## ローカル開発

PHP 8.1以降が利用できる端末で実行します。

```powershell
php -S 127.0.0.1:8787 -t .
```

ブラウザで <http://127.0.0.1:8787/> を開きます。静的画面だけなら任意のHTTPサーバーでも表示できますが、天気の実データには`api/weather.php`が必要です。

検証:

```powershell
npm run verify
php -l api/weather.php
```

## 設定

`data/config.json`で次を変更できます。

- Ambient復帰・背景切替・天気更新・pixel shiftの間隔
- 天気地点（名称、緯度、経度、タイムゾーン）
- 背景画像カタログと既定の審査状態
- Webページ定義と`iframe` / `external`表示方式

## Weather API

ブラウザは同一オリジンの`api/weather.php`だけを呼びます。PHPがOpen-Meteo Forecast APIへ接続し、10分のサーバーキャッシュを返します。キーはクライアントにもサーバーにも保存しません。上流障害時は最大6時間のサーバーキャッシュ、その後ブラウザに保存された最終成功データを順に使います。

## Ambient背景ライブラリ

- 生成記録のある3枚を公開版の初期「採用」に設定し、残り92枚は「候補」
- v0.3ではOpenAIで働く人々5枚、Googleで働く人々5枚、日本の7都市各2枚、宇宙14枚、動くオーロラ3枚を追加
- Settingsでタイプ選択、候補・採用・不採用、状態・カテゴリ絞り込み、4Kプレビューが可能
- Ambientは選択タイプ内の採用済み画像だけを使用。0枚なら採用済みミックスへ安全にフォールバック
- 「オーロラ・アニメーション」の3枚は採用後、長周期のドリフトと光の揺らぎで表示。`prefers-reduced-motion`では静止表示
- 審査状態とタイプ選択は端末の`localStorage`に保存し、カタログ更新と分離
- 一覧は640×360サムネイルを遅延読込し、3840×2160本体は表示時だけ取得

OpenAI / Googleの人物画像は、実在の社員・オフィスを記録した写真ではなく、架空の人物と空間によるイメージ画像です。

生成時のプロンプトセットは[`assets/backgrounds/PROMPTS.md`](./assets/backgrounds/PROMPTS.md)に記録しています。

## NARA/GOコピー

`web/nara-go/`には、2026-09-03時点の`/nara-go/`通常表示・シンプル表示・静的アセット・時刻表JSONのコピーを格納しています。切替リンクはコピー内で完結します。元の`/nara-go/`は変更しません。

取得元とコピー側だけの変更点は[`web/nara-go/SOURCE.md`](./web/nara-go/SOURCE.md)に記録しています。

将来コピーを更新する場合は、元サイトの現行ファイルと改正日を確認し、コピー側だけを差し替えて両表示を検証してください。

## デプロイ

本番パスは`/tama-info/`です。環境変数やデータベースは不要です。アプリ単位のバックアップを作成後、このリポジトリのファイルだけを同期します。詳細は[OPERATIONS.md](./OPERATIONS.md)を参照してください。

v0.4は2026-09-03にXserverへ反映し、匿名HTTP 200、ChatGPT in-app browserでの7 Tool登録、Weather / Web / Information / Ambientの実画面変更を確認しています。Challenge用Public Sourceでは第三者の実時刻データを含めず、同じ画面と操作を検証できるsynthetic scheduleへ置換しています。

## Version history

[CHANGELOG.md](./CHANGELOG.md)を参照してください。

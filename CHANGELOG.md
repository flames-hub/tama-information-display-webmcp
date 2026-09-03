# Version history

> Public Challenge snapshot note: three legacy v0.1 abstract backgrounds without
> repository-local provenance records are excluded. Three documented generated
> images are the initial accepted set, so the public catalog contains 95 unique
> generated images. See `ASSET_AND_DATA_NOTICES.md`.

## 0.4.0 — 2026-09-03

- 既存Application Logicを共有する任意のWebMCP Adapterと7 Toolを追加
- Agent用Information画面、Agent Activity、直前Agent操作のUndoを追加
- 人間の手動操作をAgent操作と自動復帰より優先し、手動後の状態上書きを防止
- 非対応ブラウザでは登録をスキップし、Tool登録失敗を通常UIから隔離
- Web表示を設定済みHTTP(S) URLとローカルNARA/GOコピーへ限定
- Debug UIを`?webmcp-debug=1`時だけ表示し、Remote同期は無通信の`disabled`とした
- WebMCP設計文書、Devpost提出文、3分デモ台本、MIT Licenseを追加

## 0.3.0 — 2026-09-03

- OpenAIで働く人々5枚、Googleで働く人々5枚を架空の人物・空間によるイメージ画像として追加
- 東京・大阪・京都・奈良・札幌・沖縄・広島を各2枚、合計14枚追加
- 星団・星雲・銀河・星空・流星群などの宇宙背景を14枚追加
- オーロラ3枚へ長周期のドリフトと光の揺らぎを加えるAmbientアニメーションを追加
- `prefers-reduced-motion`利用時はオーロラを静止表示するよう対応
- 背景カタログを15カテゴリ・95枚へ拡張し、新規41枚は候補状態から開始

## 0.2.0 — 2026-09-03

- Ambientタイプ選択と、採用済み画像だけを使うカテゴリ別ローテーションを追加
- 背景ライブラリに候補・採用・不採用、絞り込み、拡大プレビューを追加
- 端末ごとの審査結果とAmbientタイプを`localStorage`へ保存
- 9カテゴリの高解像度Ambient背景と軽量サムネイルを追加

## 0.1.0 — 2026-09-03

- Ambient、Weather、Web、Information OS、Settingsを実装
- Pointer Eventsによる左右・上下フリックとマウス操作を実装
- 5分無操作時のAmbient自動復帰を実装
- 3枚のローカル4K WebP背景、クロスフェード、pixel shiftを実装
- Open-Meteoを利用するPHP天気プロキシと失敗時キャッシュ表示を実装
- NARA/GOの通常表示・シンプル表示を`/tama-info/`配下へコピーし、iframe内で切替可能にした
- Service Worker、Web App Manifest、全画面表示ボタンを追加
- 375pxから4Kまでのレスポンシブ表示に対応

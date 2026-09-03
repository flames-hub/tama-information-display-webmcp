# TAMA Information Display

## タグライン

人が触れて使え、Agentも安全に表示を組み替えられる、人の意思を上書きしない静かなAmbient Display。

## 一文で

TAMAは常設OLEDディスプレイを、人が直接操作できる状態を保ちながら、AgentがWebMCPの構造化Toolで天気、交通、短いお知らせを表示できる共有情報面へ変えます。

## Inspiration

常時表示は、静かであってこそ役に立ちます。壁のディスプレイは離れた場所から美しく、近づけばすぐ理解でき、Agentがいない時もタッチで使えなければなりません。一方で「奈良の天気を表示して」という依頼を実現するために、Agentが座標やDOMを推測するべきではありません。

TAMA Information Displayは、人とAgentが同じ物理画面を使いながら、人の意思を最終優先できるかを探るプロジェクトです。

## What it does

通常時は、選択できる背景、時計、天気コンテキスト、焼き付き配慮の微細な動きを備えた4K OLED向けAmbient Displayとして動きます。人はスワイプやタップでWeather、Information OS、Web、Settingsへ移動できます。

WebMCP対応環境では7つのToolを登録し、Agentは現在状態の取得、4画面の切替、奈良の天気表示、NARA/GO通常・シンプル表示、優先度付きメッセージ表示、Ambient復帰、直前のAgent操作だけのUndoを実行できます。公開デモはログインもAPI Keyも不要です。

## Why WebMCP

映画的でジェスチャー中心の表示UIは、視覚クリック自動化には向きません。WebMCPにより、画面の意図を名前とSchemaを持つ操作として公開できます。AgentはDOMを推測せず、既存の人間向け操作と同じApplication Logicを使って実画面を変えられます。

## How WebMCP is implemented

任意のAdapterが`document.modelContext`を検出し、利用可能な時だけ`document.modelContext.registerTool(...)`で7 Toolを登録します。非対応・登録失敗時は安全に終了し、通常UIはそのまま動作します。

AdapterはSchemaとエラー境界だけを担当し、処理を二重実装しません。Tool callbackは共有`DisplayController`から既存Router、Ambient、Weather、WebViewへ委譲します。Adapterを外しても人間向けUIは成立します。

許可済みHTTPS URLだけを同一オリジンコピーへ写像し、Agent入力は`textContent`で描画します。Remote同期は無効、Debug UIは`?webmcp-debug=1`時だけ表示されます。

## What humans and agents can do together

Agentは天気、交通、会議のお知らせを数秒で共有画面へ準備できます。人はその直後でもタッチやスワイプで自由に変更できます。

優先順位は次のとおりです。

`人の手動操作 > Agent操作 > 自動・初期状態`

Agent操作後に人が触れた場合、時間指定復帰とUndoを無効化し、人が選んだ画面を勝手に戻しません。

## How we built it

依存のないHTML / CSS / JavaScriptと小さなPHP天気Proxyで構成し、WebMCPを取り外せるIntegration Layerとして追加しました。Node標準テストでTool登録、非対応環境、登録失敗、text-safe表示、URL allowlist、Undo、手動優先を検証しています。

また、元のNARA/GOを変更せず、通常・シンプル表示切替を残したiframe向けローカルコピーをTAMA配下に持ちます。

## Challenges

最難関はTool登録ではなく、物理画面の所有権でした。Agentの時間指定復帰やUndoは、人がすでに画面を変えた後には便利ではなく妨害になります。そこで手動revision guardを導入しました。

WebMCPは実験段階のため、任意機能がアプリ起動の依存にならないprogressive enhancementも重要でした。

## Accomplishments

- 7つの実用Toolが実Application Controllerを再利用
- Tool実行で実画面が即時に変化
- 非対応ブラウザでも完全な手動操作を維持
- 人の入力がAgentのtimerとUndoより安全に優先
- Debug / Agent Activityが通常表示を邪魔しない
- ログイン、提出用Credential、API Keyが不要

## What we learned

優れたBrowser ToolはUIの横に別APIを作るものではなく、UI自身が使う意図へ細いAdapterを置くものです。また、共有画面の協調には、単純な時系列ではなく衝突時の明示的な優先規則が必要だと分かりました。

## What’s next

利用者が明示的に有効化する認証済み複数Display連携、承認付きSchedule、複数地点天気、永続Audit履歴を検討します。Remote同期を追加する場合も、人間優先規則を維持します。

## Links

- Live URL: https://tama-hub.xvps.jp/tama-info/
- Repository: https://github.com/flames-hub/tama-information-display-webmcp
- Demo video: **YOUTUBE_PUBLIC_URL_PENDING**

## Challenge期間中の変更

従来の人間向け表示操作を残し、WebMCP Adapter、共有Display facade、Information画面、Agent Activity、安全なUndo、手動優先の復帰guard、Tool tests、提出資料を追加しました。公開履歴の2026年9月3日付commitで区別できます。

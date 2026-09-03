# TAMA Information Display 運用手順

## Windows常設表示

1. JAPANNEXTディスプレイをHDMIとUSBで接続する。
2. Windowsの「設定 → システム → ディスプレイ」で横向き、推奨解像度、適切な拡大率を選ぶ。
3. EdgeまたはChromeで`https://tama-hub.xvps.jp/tama-info/`を一度開き、背景とオフラインキャッシュの準備完了を待つ。
4. 通常運用は`F11`、またはSettingsの「全画面で表示」を使用する。

Chrome kiosk起動例:

```text
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --no-first-run --disable-pinch https://tama-hub.xvps.jp/tama-info/
```

Edge kiosk起動例:

```text
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk https://tama-hub.xvps.jp/tama-info/ --edge-kiosk-type=fullscreen --no-first-run
```

自動起動は、上記コマンドをショートカットにしてユーザーのスタートアップへ置きます。Windowsの自動ログインや電源設定は端末の利用環境に合わせ、個別に有効化してください。

## 日常確認

- 起動後すぐAmbientが表示される。
- 時刻が現在時刻と一致する。
- Weatherに更新時刻が表示される。取得失敗でも画面全体は動作する。
- WebでNARA/GOが表示され、通常表示とシンプル表示を切り替えられる。
- Settingsで背景を候補・採用・不採用へ変更でき、採用画像が選択したAmbientタイプへ反映される。
- 「オーロラ・アニメーション」を採用して選ぶと、背景がゆっくり移動し、光が穏やかに揺らぐ。
- OSで「視差効果を減らす」を有効にした端末では、オーロラが意図どおり静止表示になる。
- 背景を拡大表示でき、再読み込み後も端末の審査状態が保たれる。
- 左右・上下フリックが斜め操作やNARA/GO内スクロールを邪魔しない。
- 無操作後にAmbientへ戻る。

## WebMCP確認

- 非対応ブラウザでもAmbient、Weather、Web、Settings、背景審査が従来どおり動く。
- 対応環境では7 Toolが登録され、Tool実行後に実画面が切り替わる。
- Agent ActivityはAgent操作後だけ表示され、通常利用では画面を覆わない。
- Agent操作後に手動で別画面へ移動すると、Undoは`manual_state_preserved`となり手動画面を保持する。
- `show_information`の時間指定中に手動操作した場合も、自動復帰で手動画面を上書きしない。
- Debug UIは通常非表示。確認時だけURLへ`?webmcp-debug=1`を追加する。
- v0.4のRemote syncは`disabled`であり、通常起動時に同期通信を行わない。

WebMCP Adapterの単体契約は`npm run test:webmcp`で確認できます。ネイティブ確認は本番反映後、ChatGPT in-app browserまたはWebMCPを有効にしたChromeで行い、通常ブラウザ確認と結果を分けて記録します。

## 更新とロールバック

本番更新前に`/tama-info/`だけをタイムスタンプ付きでバックアップします。ステージング領域へ新しいファイルを置き、PHP構文、必須ファイル、ファイル数を確認してから切り替えます。`/nara-go/`、Caddy、PHP-FPM、他アプリ、証明書、DNSは変更対象外です。

問題があれば、バックアップした`/tama-info/`を同じパスへ戻します。Service Worker更新後に旧画面が残る端末では、ページを2回再読み込みするか、ブラウザのサイトデータから対象サイトのキャッシュだけを削除します。

WebMCP固有機能だけを止める場合は、`js/app-v0.4-r9.js`からAdapterのimportと`registerWebMCP()`呼び出しを外します。DisplayControllerと通常UIはそのまま利用できます。アプリ全体を戻す場合は、従来どおり`/tama-info/`単位のバックアップへ復元します。

## Weather障害

Open-Meteoへ接続できない場合、PHPは最大6時間の古いキャッシュを返します。それもない場合はHTTP 502になり、ブラウザ側は最後に成功した保存データを表示します。時刻・背景・画面切替はネットワークと独立して動作します。

## OLED配慮

- 背景は設定間隔でクロスフェードする。
- オーロラ・アニメーションは52秒周期の微細なドリフトと15秒周期の光量変化を使い、動画ファイルの常時デコードを避ける。
- 新規背景は候補のままではAmbientに表示されない。使用する画像をSettingsで採用する。
- 選択タイプに採用済み画像がない場合は、真っ黒にせず採用済みミックスへフォールバックする。
- 時計・日付ブロックは2〜8pxの範囲で周期移動する。
- システム表示も小さく位置を変える。
- Information OSやWeatherは無操作でAmbientへ戻る。
- 長時間使わない場合はディスプレイ本体の省電力機能を併用する。

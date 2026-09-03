# Ambient background prompt set

TAMA Information Display v0.2.0で追加した54枚は、Codex組み込みのImageGenを使って1枚ずつ新規生成した。生成原本は16:9横長PNG、アプリ用ファイルは3840×2160・WebP quality 88、審査用サムネイルは640×360・WebP quality 72。

## 共通指定

```text
Use case: photorealistic-natural
Asset type: premium 16:9 ambient display background
Style/medium: highly detailed photorealistic editorial travel or natural landscape photography
Composition/framing: cinematic wide 16:9 landscape, calm visual flow, usable low-detail space for clock and weather overlays, no dominant centered subject
Constraints: no readable signs, no text, no logos, no watermark, natural restrained colors, believable place, materials and weather, suitable for a premium OLED display
Avoid: excessive HDR, oversaturation, fantasy terrain or architecture, tourist crowds, visual clutter
```

各画像では、上記に次の`Primary request`と場所固有の光・素材指定を組み合わせた。

## 世界の町並み

1. `town-01` — 雨上がりの中欧旧市街、青の時間、濡れた石畳と温かな窓。
2. `town-02` — 夜明けのアムステルダム運河、細い歴史的家並みと水面の反射。
3. `town-03` — 朝のリスボンの坂道、アズレージョの建物と遠い川。
4. `town-04` — 秋の午後のトスカーナ丘陵都市、テラコッタ屋根とオリーブ畑。
5. `town-05` — 雨上がりのパリ住宅街、夜明け、石灰岩の外壁と鉄のバルコニー。
6. `town-06` — 雪の朝のケベック旧市街、石造りの建物と控えめな温かい窓。

## リゾート

1. `resort-01` — ハワイの火山性海岸の日の出、黒い溶岩とターコイズの海。
2. `resort-02` — 夜明けのモルディブ礁湖、遠い水上ヴィラと静かな浅瀬。
3. `resort-03` — 雨上がりのセーシェル、花崗岩の巨石と透明な海。
4. `resort-04` — ボラボラの木陰の岸辺、礁湖、遠い火山と小さな水上ヴィラ。
5. `resort-05` — 夜明け前のサントリーニ、白い幾何学的街並みとエーゲ海。
6. `resort-06` — 雨季の朝のバリ、雨上がりの棚田と静かな木造リトリート。

## 空撮・鳥瞰

1. `aerial-01` — 黒い火山性堆積物を流れるターコイズの氷河河川を真上から。
2. `aerial-02` — 黄葉の森、山上湖、初雪の峰を高い斜め空撮で。
3. `aerial-03` — 風紋の砂丘と一つの岩塊を真上から、夕方の低い光。
4. `aerial-04` — モンスーン期の棚田と蛇行する川、霧の朝の鳥瞰。
5. `aerial-05` — 青の時間、湾曲した海岸都市と灯り始めた街路。
6. `aerial-06` — 秋の森を一本の道が横切り、小さな霧の湖へ続く空撮。

## 雲海

1. `cloud-sea-01` — 日の出、雲海から高い山稜だけが現れる広大な風景。
2. `cloud-sea-02` — 森の丘が島のように朝雲から現れる高所からの眺め。
3. `cloud-sea-03` — 火山カルデラの縁と巨大な雲の逆転層、午後の光。
4. `cloud-sea-04` — 雲海の上の遠い山小屋、藍色の夜明け前。
5. `cloud-sea-05` — 嵐の後、光る雲間から雪のアルプスが現れる。
6. `cloud-sea-06` — 春の緑の谷をやわらかな朝雲が満たす高所の景観。

## 郷愁

1. `nostalgia-01` — 夏の小雨に濡れた日本の住宅路地、夕暮れと一つの玄関灯。
2. `nostalgia-02` — 欧州の小さな田舎駅、夕方、古いベンチと温かな待合室。
3. `nostalgia-03` — 夜明け前の1950年代風ロードサイドダイナー、遠いヴィンテージ車。
4. `nostalgia-04` — 冬朝の使い込まれた家族の台所、木の机、琺瑯ケトルと湯気。
5. `nostalgia-05` — 雨上がりの欧州石畳を進む古い路面電車、夕暮れ。
6. `nostalgia-06` — 雨上がりの夏庭へ開く日本の縁側、古い床板と一杯の水。

## 大氷原・雪原

1. `icefield-01` — 深いコバルト色の亀裂が走る南極氷原と遠い低山。
2. `icefield-02` — グリーンランドの山間を海へ下る巨大氷河と小さな氷山。
3. `icefield-03` — 風成雪が続く北極圏の広大な雪原、藍色の薄明。
4. `icefield-04` — 低い冬空の下、風雪の線が水平線へ続く凍結湖。
5. `icefield-05` — 低木が雪に埋もれたシベリアの雪原と遠いタイガ。
6. `icefield-06` — 自然に削られた巨大な青い氷の峡谷、人物なし。

## サンタクロース村

1. `santa-village-01` — 雪深いフィンランド・ラップランドの小さな木造村、青の時間。
2. `santa-village-02` — 雪の樅林に建つ手仕事の木造工房、温かな窓と細い煙。
3. `santa-village-03` — 冬の朝のトナカイ厩舎、自然なトナカイと素朴な木造小屋。
4. `santa-village-04` — 北極圏の森の深紅の郵便小屋、雪道と控えめな灯り、看板なし。
5. `santa-village-05` — 雪の樅林に点在する小さな灯りの村を青の時間に空撮。
6. `santa-village-06` — 赤い冬服の遠い旅人が小さなそりと森へ進む。顔・固有キャラクター表現なし。

## オーロラ

1. `aurora-01` — フィンランド・ロヴァニエミ近郊の雪の樅林と緑のオーロラ。
2. `aurora-02` — イエローナイフ近郊の凍結湖、開水面に映る緑と淡い紫の光。
3. `aurora-03` — ロフォーテンの暗いフィヨルドと険しい山、遠い漁村の灯り。
4. `aurora-04` — スウェーデン・アビスコの一軒の木造小屋と広いオーロラ。
5. `aurora-05` — グリーンランドの小さな沿岸集落、暗いフィヨルドと柔らかな光帯。
6. `aurora-06` — フィンランドの樹木のない冬の高原、風成雪と大きな空。

## アイスランド

1. `iceland-01` — 冬の黒砂海岸、白い北大西洋の波、遠い氷河と玄武岩岬。
2. `iceland-02` — 雨上がりの苔の谷へ落ちる細く高い滝、黒い玄武岩と霧。
3. `iceland-03` — 錆色・黒・苔色の高地を流れる淡い網状河川の斜め空撮。
4. `iceland-04` — 自然形成された青い氷洞、半透明の氷壁と雪へ抜ける暗い開口部。
5. `iceland-05` — 日の出の地熱谷、黄土色の地面を白い蒸気が流れる。
6. `iceland-06` — 北部の巨大な海食崖、暗い北大西洋、低い雲と冷たい波。

---

# v0.3.0 追加プロンプトセット

追加した41枚もCodex組み込みのImageGenで1枚ずつ新規生成した。生成原本はすべて1672×941の横長PNG。アプリ用にはLanczos 3で3840×2160へリサンプルしてWebP quality 88、審査用には640×360・WebP quality 72を作成した。人物は実在社員や実在オフィスの記録ではなく、すべて架空の人物・空間によるイメージ画像である。

## OpenAIで働く人々 共通指定

```text
Use case: photorealistic-natural
Asset type: premium 16:9 ambient display background
Style/medium: highly detailed photorealistic documentary workplace photography, real skin and fabric texture, subtle film grain
Composition/framing: cinematic wide 16:9 landscape, primary faces away from the upper-left clock area, calm negative space
Constraints: fictional adults only, no resemblance to public figures or known employees, no identifiable real office, no readable screens, no text, no logos, no trademarks, no watermark, believable hands
Avoid: posed corporate stock-photo look, excessive HDR, oversaturation, distorted faces or hands, visual clutter
```

1. `openai-people-01` — 現代的なAI研究オフィスの大きな机で、5人の架空の研究者・エンジニアが協働する。
2. `openai-people-02` — 静かなフォーカスルームで、架空の女性リサーチャーが個人作業に集中する。
3. `openai-people-03` — 控えめなラウンジで、架空の同僚2人がコーヒーを片手に休憩する。
4. `openai-people-04` — 雨の朝の住まいで、架空のエンジニアが猫のそばで在宅作業する。
5. `openai-people-05` — 緑のある中庭を歩きながら、架空の研究者3人が対話する。

## Googleで働く人々 共通指定

OpenAI人物の共通指定と同じ人物・品質・画角・禁止事項を使い、場所は「実在するGoogleオフィスを特定・再現しない架空のテクノロジー職場」とした。

1. `google-people-01` — モジュール家具と抽象図形のあるワークショップで、架空のデザイン・開発チームがアイデアを整理する。
2. `google-people-02` — オフィスライブラリーの窓辺で、架空のエンジニアが静かに考える。
3. `google-people-03` — 木陰のテラスで、架空の同僚3人が昼休みを楽しむ。
4. `google-people-04` — 明るい自宅スタジオで、架空のデザイナーがスケッチとタブレットを使う。
5. `google-people-05` — 夕暮れの小さなプロジェクト室で、架空のエンジニア2人がペアプログラミングする。

## 日本の都市 共通指定

```text
Use case: photorealistic-natural
Asset type: premium 16:9 ambient display background
Style/medium: highly detailed photorealistic editorial city photography, natural atmospheric perspective, subtle film grain
Composition/framing: cinematic wide 16:9 landscape, calm visual flow, low-detail upper-left space for clock overlays
Constraints: geographically plausible, no readable signs, no text, no prominent logos, no watermark, restrained natural colors, no identifiable faces
Avoid: excessive HDR, oversaturation, fantasy architecture, tourist crowds, visual clutter
```

1. `japan-city-01` — 雨上がりの東京湾越しに、青の時間の現代的な東京スカイラインを望む。
2. `japan-city-02` — 春雨後の西東京の住宅街、朝の踏切を通勤列車が通過する。
3. `japan-city-03` — 日の出の大阪・大川、近代的な街並みと橋、桜、水面の反射。
4. `japan-city-04` — 夏雨の夕方、梅田の高層街・鉄道・道路を高所から望む。
5. `japan-city-05` — 夜明けの京都・東山、町家と石畳、遠い塔の輪郭。
6. `japan-city-06` — 秋の京都・嵐山、朝霧の川、橋、低い建物と色づく山。
7. `japan-city-07` — 雨上がりの奈良町、青い夕刻、木格子の家と濡れた路地。
8. `japan-city-08` — 若草山から日の出の奈良盆地、寺院の屋根と遠い山を望む。
9. `japan-city-09` — 新雪に包まれた札幌中心部の大通り、青い夕刻と暖かな窓。
10. `japan-city-10` — 雪嵐後の丘から、格子状に広がる札幌市街と遠い山を望む。
11. `japan-city-11` — 雨上がりの那覇の住宅街、石垣、赤瓦、亜熱帯植物と青い夕刻。
12. `japan-city-12` — 日の出の那覇港、低い都市景観、穏やかな海と遠い島。
13. `japan-city-13` — 雨上がりの広島の川辺、橋、街路、遠い緑の山と朝の光。
14. `japan-city-14` — 高台から見る青の時間の広島デルタ、河川、市街、瀬戸内海。

## 星団・星雲・銀河・星空 共通指定

```text
Use case: scientific-educational
Asset type: premium 16:9 ambient display background
Style/medium: scientifically inspired high-resolution deep-sky astrophotography, fine star detail, realistic dust and gas structure, restrained color processing
Composition/framing: cinematic wide 16:9 field, main luminous structure away from the upper-left clock area, deep negative space
Constraints: no text, no labels, no borders, no watermark, no spacecraft, plausible astronomical structure, true black areas for OLED
Avoid: fantasy space art, neon oversaturation, lens-flare clutter, repeated stars, artificial symmetry
```

1. `space-01` — プレアデス星団、青白い若い星と淡い反射星雲。
2. `space-02` — オリオン大星雲、電離ガス、暗黒帯、トラペジウム周辺。
3. `space-03` — カリーナ星雲、冷たい塵の柱と明るい電離面。
4. `space-04` — アンドロメダ銀河、塵の腕と二つの淡い伴銀河。
5. `space-05` — 月のない高原砂漠に架かる天の川。
6. `space-06` — 雪峰のある高山湖に映る天の川銀河中心。
7. `space-07` — 夏の草原と小さな天文台の上に広がるペルセウス座流星群。
8. `space-08` — 雪の森と凍結湖を横切るふたご座流星群。
9. `space-09` — 暖色の古い恒星が中心へ密集する球状星団。
10. `space-10` — 南天の海岸上空に浮かぶ大小マゼラン雲。
11. `space-11` — 馬頭星雲とオリオン分子雲の広い星野。
12. `space-12` — 電離ガスの中にそびえる、星を形成する塵の柱。
13. `space-13` — 暗い塵の帯と明るい中心核を持つソンブレロ銀河。
14. `space-14` — 多数の微小な渦巻・楕円・不規則銀河を含む宇宙の深視野。

## オーロラ・アニメーション 共通指定

```text
Use case: photorealistic-natural
Asset type: premium 16:9 animated ambient display base frame
Style/medium: highly detailed photorealistic night landscape photography, physically plausible aurora curtains, natural snow and sky texture
Composition/framing: broad uninterrupted sky with long flowing aurora bands that remain believable under slow pan, scale and luminous shimmer, quiet lower-third landscape
Constraints: no people, no readable signs, no text, no logos, no watermark, restrained natural colors, true dark areas for OLED
Avoid: fantasy ribbons, neon oversaturation, excessive stars, extreme HDR, cluttered foreground
```

1. `aurora-motion-01` — フィンランドの凍結湖と雪の樅林、広いエメラルド色の光のカーテン。
2. `aurora-motion-02` — カナダ北部の雪の森、紫と緑のオーロラコロナ。
3. `aurora-motion-03` — アイスランドの黒砂海岸、赤と緑の大きな光の弧。

表示時は動画へ変換せず、52秒周期の微細なパン・拡大と15秒周期の半透明発光をCSSで重ねる。`prefers-reduced-motion: reduce`ではアニメーションを停止する。

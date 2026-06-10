# プチヘルメース PWAアプリ

来店ポイントシステム＆酵母育成パン工房ゲーム

## 技術スタック

- Next.js 14 (App Router) + React + TypeScript
- Tailwind CSS
- Framer Motion
- Zustand (状態管理)
- Supabase (認証・DB)
- PWA (next-pwa)

## セットアップ

```bash
npm install
cp .env.local.example .env.local
# .env.localにSupabaseの接続情報を設定
npm run dev
```

## 構造

- `/` - メインアプリ（ポイントタブ・ゲームタブ）
- `/collection` - パン図鑑
- `/admin` - 店舗管理画面（日替わりQRコード生成）

## 開発

```bash
npm run dev    # 開発サーバー起動
npm run build  # プロダクションビルド
npm run lint   # ESLint実行
```

## 🌸 プチヘルメースの谷（リアル3D散策版・NEW）

リアル寄りのモダン3DCG（PBR＋IBL）で、旧南方小学校と南方の谷をまるごと歩いて
擬似体験する三人称散策ゲーム（`public/world/`、URLパスは `/world`）。
レンダリングは大気散乱の空（three 公式 Sky）を PMREM で環境マップ化した
イメージベースドライティング、テクスチャスプラッティング地形（草/土/岩＋法線マップ）、
実反射する水（公式 Water）、EffectComposer のポストプロセス（Bloom＋ACES＋MSAA）、
風に揺れる草・稲のインスタンシングで構成。アセットは three.js リポジトリ同梱素材
（MIT）とキャンバス生成のみ。モバイルは品質プリセットで自動フォールバックします。

- **舞台**: バス停で降車 → 桜並木の坂 → 石橋（出原川）→ 校庭 → 校舎1F（歩いて入れる）
- **店内**: パン屋プチヘルメース（L字カウンター・面陳列のパン壁・酵母瓶6種・石窯）、カフェ「South in North」
- **周辺**: 棚田・麦畑・八幡神社（石段と鎮守の森）・コンポスト・ハーブ花壇・遊具・体育館・農家
- **擬似体験**: 大下さんとの会話、パン購入（実ラインナップ＋酵母ストーリー）、カフェ注文、
  校庭ランチ、循環（パン→堆肥→野菜）の解説、10ステップのクエスト（完走でロスパン袋）
- PC（WASD＋ドラッグ）/ モバイル（ジョイスティック＋タップ）、PWAオフライン対応

#### /world のテスト

```bash
cd public/world && for t in *.test.mjs; do node "$t"; done   # 地形・衝突・クエストの単体テスト
node test-world/shot-qa.mjs        # ヘッドレス撮影QA（/tmp/world_*.png, pageerrors=0 を確認）
node test-world/playthrough.mjs    # クエスト10ステップの自動完走E2E
node test-world/gen-icons.mjs      # PWAアイコン再生成
```

## 🥖 プチヘルメース（マイクラ風ブラウザゲーム）

旧・北広島町立南方小学校のパン屋「プチヘルメース」を、マイクラ風の里山の世界で
擬似体験するゲーム（Three.js / バニラES Modules / PWA、`public/minecraft/`、
URLパスは `/minecraft`）。実在の店舗を応援する**非公式ファンメイド作品**です。
ロゴ・名称の権利は各権利者に帰属します。

### 主な機能

- 畑で収穫 → 瓶で天然酵母を発酵 → パンを焼く → 店主の大下さんに届けて開店（クエスト「今日のしごと」5ステップ）
- 校舎1階のパン屋（切手モチーフの看板・酵母瓶棚・売り場）と姉妹カフェ「South in North」（☕注文・校庭ランチ）
- 旧南方小学校の再現: 昇降口・廊下・コミュニティー広場・旧給食室・体育館・校庭（桜・コンポスト・ハーブ花壇）
- 南方さんぽ（校内スポット巡り）、NPC・モブ、昼夜サイクル、シード共有（`#seed=`）、自動保存
- PC（WASD＋マウス）/ モバイル（タッチ操作・描画距離は既定6チャンク）両対応、オフライン動作（Service Worker）

### オーバーホール S1–S6 概要

- **S1**: ブランド/学校系の新ブロック約40種（切手ロゴ看板・深緑#5C6B4A/麦色#E8D5B7ウール等）
- **S2**: 校舎・校庭・体育館の作り込み（下駄箱・緑黒板・国旗・桜並木・遊具）
- **S3**: パン屋v3（ヒーロー陳列・酵母瓶棚）/ South in North v2 / 旧給食室
- **S4**: 周辺の里山v2（杉林・田んぼの稲・ガードレール・神社・バス停）
- **S5**: 擬似体験（カフェ注文・校庭ランチ・行列イベント・南方さんぽ・店主「大下さん」実名台詞）
- **S6**: 販売レベル仕上げ（ブランドカラーのスタート画面・About・OGP・共有文・モバイル既定）

紹介動画づくりには VOICEVOX 等の合成音声ツールを利用できます（ゲーム本体には音声合成は含みません）。

### 遊ぶ（本番URL）

```
https://my-first-project-oshitam-ctrls-projects.vercel.app/minecraft
```

> 注意: `my-first-project.vercel.app`（スコープ無しの短い名前）は別アカウントが
> 押さえている共有ドメインで 404 になります。必ず上の **スコープ付き** URL（末尾
> `/minecraft`）を使ってください。ゲームへのルーティングは `next.config.mjs` の
> rewrites（`/minecraft → /minecraft/index.html`）で解決しています。

### テスト

```bash
cd public/minecraft && for t in *.test.mjs; do node "$t"; done   # 各モジュールの単体テスト
node --import ./test-minecraft/setup.mjs test-minecraft/run.mjs   # ヘッドレス起動チェック
node test-minecraft/play.mjs                                      # 端末別の起動/エラー確認
```


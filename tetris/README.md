# TETRIS (mobile web mock)

モバイルWeb向けの現代的テトリスモック。Vite + TypeScript + Canvas 2D、依存ゼロのVanilla実装。

## 特徴

- **公式ガイドライン準拠**：SRS、7-bag、ホールド、ゴースト、T-spin、B2B、コンボ
- **仮想ボタン無しジェスチャー操作**：画面下半分全体を操作エリアに
- **60fps固定ゲームループ**：固定タイムステップのシミュレーションと rAF 描画を分離
- **決定論的エンジン**：同一シード＋同一入力で同じ結果（リプレイ/デバッグに有利）
- **ゲームフィール重視**：着地スクイーズ、ラインフラッシュ、崩壊アニメ、重力落下、パーティクル、スクリーンシェイク、コンボ背景彩度
- **効果音は Web Audio API で合成**（音源ファイル不要）
- **PWA**：インストール可、オフラインでも起動

## セットアップ

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # dist/ にデプロイ用ファイル一式
npm run preview # ビルド成果物をローカル確認
```

## 操作

### タッチ（モバイル）

| 操作 | ジェスチャー |
| --- | --- |
| 左右移動 | 左右スワイプ（24px ごとに 1 マス） |
| ソフトドロップ | 下スワイプ（24px ごとに 1 マス） |
| ハードドロップ | 下フリック（速いスワイプ） |
| 右回転 | タップ |
| 左回転 | 長押し or 2本指タップ |
| ホールド | 上スワイプ（40px 以上） |

画面下半分のみがタッチの操作領域。上半分はスコア等の表示で、スクロール等を邪魔しない。

### キーボード（デスクトップ・デバッグ用）

| キー | 動作 |
| --- | --- |
| ← → | 左右移動 |
| ↓ | ソフトドロップ |
| Space | ハードドロップ |
| ↑ / X | 右回転 |
| Z / Ctrl | 左回転 |
| Shift / C | ホールド |
| R | リスタート |
| Enter | スタート/リトライ |

## チューニング

**`src/config.ts`** に触り心地を左右するすべての数値が集約されている。非エンジニアでもコメント頼りにここだけ触れば遊び心地を変えられる。

主要な項目：

- `DAS_MS` / `ARR_MS` … 連続移動の遅延とレート
- `LOCK_DELAY_MS` / `LOCK_RESET_MAX` … ロックディレイと無限回避の最大数
- `SWIPE_MOVE_THRESHOLD_PX` / `FLICK_VELOCITY_PX_MS` / `LONG_PRESS_MS` … ジェスチャー閾値
- `SQUASH_DURATION_MS` / `LINE_FLASH_MS` / `LINE_COLLAPSE_MS` / `GRAVITY_DROP_MS` … 演出時間
- `SHAKE_STRENGTH_PX` / `SHAKE_DURATION_MS` … スクリーンシェイク
- `COLORS` … ピース色

数値変更後は `npm run dev` 中なら自動リロードで即反映。

## プロジェクト構造

```
tetris/
├── index.html
├── src/
│   ├── main.ts                # エントリーポイント、ゲームループ、UIオーバーレイ、SW登録
│   ├── config.ts              # 全チューニング値
│   ├── engine/                # ロジック層（描画・入力・音に非依存）
│   │   ├── types.ts
│   │   ├── rng.ts             # Mulberry32 + 7-bag
│   │   ├── piece.ts
│   │   ├── srs.ts             # キックテーブル
│   │   ├── board.ts           # グリッド・衝突・ライン消去
│   │   └── game.ts            # 状態遷移・スコア・ロックディレイ
│   ├── render/
│   │   ├── canvas.ts          # Canvas レンダラ
│   │   └── fx.ts              # 演出（アニメ・パーティクル・シェイク）
│   ├── input/
│   │   └── touch.ts
│   ├── audio/
│   │   └── sfx.ts             # Web Audio 合成
│   └── haptics/
│       └── vibrate.ts
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icon-192.png
│   └── icon-512.png
└── scripts/
    └── gen-icons.mjs          # アイコン再生成スクリプト
```

## デプロイ

`npm run build` の出力 `dist/` をそのまま静的ホスティング（Vercel / Netlify / Cloudflare Pages 等）に置くだけ。ビルド設定：

- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Install command**: `npm install`

## 既知の制約（モック）

- iOS Safari：Vibration API 非対応（振動はスキップ。効果音で代替）
- 横向き画面：警告表示（プレイ不可）
- モード：マラソンのみ。Sprint 等は未実装
- アイコンは仮の T 文字プレースホルダ
- BGM なし（効果音のみ）

## デバッグ

ブラウザコンソールから `__game` でゲームインスタンスにアクセスできる。

```js
__game.getSnapshot()  // 現在の状態
__game.hardDrop()     // プログラム的に操作
__game.start()        // リスタート
```

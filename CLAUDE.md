# 開発規約（このリポジトリの歩き方）

## 構成（3つの静的ゲーム + Next.jsアプリ）

| パス | 中身 | 状態 |
|---|---|---|
| `public/world/` | **プチヘルメースの谷**（リアル系3D散策・主力。Instagram導線はここ） | アクティブ開発 |
| `public/minecraft/` | マイクラ風ボクセル版 | **凍結**（バグ修正のみ。新機能は world へ） |
| `public/tetris/` | 初期の実験 | 凍結 |
| `src/` | Next.js（ポイント・図鑑・QR、Supabase） | 店舗運用向け・現状維持 |
| `public/vendor/three.module.js` | three.js r160 を**1本だけ共有**（両ゲームの importmap が参照） | 触らない |

## world の設計ルール

- **純ロジック（THREE/DOM非依存）とビジュアルを分離**: `layout.js`(座標の単一情報源) / `terrain.js` の heightAt / `collide.js` / `hotspots.js` / `data.js` は素の node でテストできる
- 色は `theme.js`、品質プリセットは `quality.js`、ポスプロは `postfx.js` に集約。マジックナンバーを散らさない
- アートディレクション: 「日本の田舎の午後」— 彩度低め・ゴールデンアワー・純白/純黒禁止
- QAフック（main.js が window に公開）: `__view(x,y,z,yaw,pitch)` 自由カメラ / `__warp(x,z,ry)` テレポート / `__time(t)` 時刻 / `__interact()` `__closeUI()` 同期操作 / `__quest` `__bag`

## テスト（コミット前に必ず）

```bash
node tools/run-unit-tests.mjs      # 全ユニットテスト（CIでも実行）
node test-world/playthrough.mjs    # クエスト10ステップ完走E2E（要 playwright）
node test-world/shot-qa.mjs        # 13視点スクショ → /tmp/world_*.png を目視
```

ヘッドレスは swiftshader で fps が極端に低い。フレーム依存の検証は禁止し、
同期フック（`__warp`/`__interact`）を使うこと。クリックは `force: true`。

## 運用

- 開発ブランチ → PR → Vercel プレビュー Ready 確認 → main マージ = 本番デプロイ
- 本番URL: `https://my-first-project-oshitam-ctrls-projects.vercel.app/world`
- SWキャッシュを変えたら `CACHE_VERSION` を必ずバンプ

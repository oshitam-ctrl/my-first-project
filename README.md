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

## 🥖 プチヘルメース（マイクラ風ブラウザゲーム）

旧・北広島町立南方小学校のパン屋「プチヘルメース」を、マイクラ風の里山の世界で
疑似体験するゲーム（Three.js / バニラES Modules / PWA、`public/minecraft/`）。

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


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

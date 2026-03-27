# パン屋予約システム

パン屋の商品予約ができるWebアプリケーションです。

## 技術スタック

- **Backend:** Python + FastAPI
- **DB:** SQLite + SQLAlchemy
- **テンプレート:** Jinja2 + Pico CSS
- **認証:** bcrypt + itsdangerous（署名Cookie）

## 機能

- 商品一覧表示
- ユーザー登録・ログイン
- 予約作成・一覧・キャンセル
- 在庫管理（日別・商品別）
- メール通知（コンソール出力のモック）
- 管理者ダッシュボード

## セットアップ

```bash
pip install -r requirements.txt
cp .env.example .env
python seed.py          # デモデータ投入
uvicorn app.main:app --reload
```

ブラウザで http://localhost:8000 を開いてください。

### 管理者アカウント（デモ）

- Email: `admin@bakery.local`
- Password: `admin123`

## テスト

```bash
pytest tests/ -v
```

## プロジェクト構成

```
app/
├── main.py          # FastAPIアプリ
├── config.py        # 設定（.env読み込み）
├── database.py      # DB接続
├── security.py      # パスワード・セッション・CSRF
├── dependencies.py  # 認証・DB依存関数
├── models/          # SQLAlchemyモデル
├── services/        # ビジネスロジック
├── routes/          # ルートハンドラ
├── templates/       # Jinja2テンプレート
└── static/          # CSS・画像
tests/               # テスト
seed.py              # デモデータ投入
```

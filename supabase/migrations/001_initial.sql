-- プチヘルメース PWAアプリ 初期スキーマ

-- 酵母マスターデータ
CREATE TABLE yeasts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rarity INTEGER NOT NULL CHECK (rarity BETWEEN 1 AND 3),
  season TEXT CHECK (season IN ('all', 'spring', 'summer', 'autumn', 'winter')),
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- パンマスターデータ
CREATE TABLE breads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  yeast_id TEXT NOT NULL REFERENCES yeasts(id),
  toppings JSONB DEFAULT '[]',
  season TEXT CHECK (season IN ('all', 'spring', 'summer', 'autumn', 'winter')),
  description TEXT NOT NULL,
  taste_description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  shop_name TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ユーザーの酵母所持状況
CREATE TABLE user_yeasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yeast_id TEXT NOT NULL REFERENCES yeasts(id),
  duplicate_count INTEGER DEFAULT 0,
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, yeast_id)
);

-- ユーザーの焼いたパン
CREATE TABLE user_breads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bread_id TEXT NOT NULL REFERENCES breads(id),
  custom_toppings JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 発酵中データ
CREATE TABLE fermentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yeast_id TEXT NOT NULL REFERENCES yeasts(id),
  bread_id TEXT REFERENCES breads(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'fermenting' CHECK (status IN ('fermenting', 'ready', 'completed')),
  temperature_bonus BOOLEAN DEFAULT FALSE
);

-- 来店ポイント
CREATE TABLE points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER DEFAULT 1,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  daily_token TEXT NOT NULL
);

-- クーポン
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('A', 'B')),
  redeemed BOOLEAN DEFAULT FALSE,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- 日替わりQRトークン
CREATE TABLE daily_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT DEFAULT 'petit-hermes',
  token TEXT NOT NULL,
  valid_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, valid_date)
);

-- インデックス
CREATE INDEX idx_user_yeasts_user ON user_yeasts(user_id);
CREATE INDEX idx_user_breads_user ON user_breads(user_id);
CREATE INDEX idx_fermentations_user ON fermentations(user_id);
CREATE INDEX idx_points_user ON points(user_id);
CREATE INDEX idx_points_token ON points(daily_token);
CREATE INDEX idx_daily_tokens_date ON daily_tokens(valid_date);

-- 同日2回以上のスキャン防止
CREATE UNIQUE INDEX idx_points_user_date ON points(user_id, (scanned_at::date));

-- RLSポリシー
ALTER TABLE user_yeasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_breads ENABLE ROW LEVEL SECURITY;
ALTER TABLE fermentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own yeasts" ON user_yeasts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own yeasts" ON user_yeasts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own yeasts" ON user_yeasts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own breads" ON user_breads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own breads" ON user_breads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own fermentations" ON fermentations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fermentations" ON fermentations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fermentations" ON fermentations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own points" ON points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own points" ON points FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own coupons" ON coupons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coupons" ON coupons FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 酵母マスターデータとパンマスターデータは全員読み取り可能
ALTER TABLE yeasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE breads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read yeasts" ON yeasts FOR SELECT USING (true);
CREATE POLICY "Anyone can read breads" ON breads FOR SELECT USING (true);

-- 日替わりトークンは管理者のみ
ALTER TABLE daily_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage tokens" ON daily_tokens FOR ALL USING (true);

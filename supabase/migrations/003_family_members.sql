-- =============================================
-- Family Members Table for Family Account Management
-- =============================================

-- family_role: 家族メンバーの役割を定義するenum型
CREATE TYPE family_role AS ENUM (
  'mother',
  'father',
  'grandmother_paternal',
  'grandmother_maternal',
  'grandfather_paternal',
  'grandfather_maternal',
  'uncle_aunt',
  'other'
);

-- family_members: 家族メンバー情報
-- - user_idはprofilesと1:1で紐づく
-- - roleは9種類 + 'other'（その他の場合はcustom_role_nameを使用）
-- - role_confirmedは移行ユーザーの初回ログイン検出に使用
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  role family_role NOT NULL DEFAULT 'other',
  custom_role_name TEXT,
  role_confirmed BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_role ON family_members(role);

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- 全メンバー閲覧可（認証済みユーザー）
CREATE POLICY "family_members_select"
  ON family_members FOR SELECT
  USING (auth.role() = 'authenticated');

-- 自分のレコードのみ挿入可
CREATE POLICY "family_members_insert"
  ON family_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のレコードのみ更新可
CREATE POLICY "family_members_update"
  ON family_members FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- Trigger: Update updated_at on change
-- =============================================
CREATE OR REPLACE FUNCTION update_family_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION update_family_members_updated_at();

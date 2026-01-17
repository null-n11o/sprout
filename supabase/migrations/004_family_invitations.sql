-- =============================================
-- Family Invitations Table for Invite System
-- =============================================

-- family_invitations: 招待コード管理
-- - codeは8文字英数字（紛らわしい文字0,O,I,1,Lを除外）
-- - 有効期限は7日間
-- - max_usesで使用回数を制限（デフォルト1回）
CREATE TABLE family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CHAR(8) NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_count INT NOT NULL DEFAULT 0,
  max_uses INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Indexes
-- =============================================
-- アクティブな招待コードのルックアップ用
CREATE INDEX idx_family_invitations_code ON family_invitations(code) WHERE is_active = true;
-- 有効期限チェック用
CREATE INDEX idx_family_invitations_expires ON family_invitations(expires_at) WHERE is_active = true;
-- 作成者検索用
CREATE INDEX idx_family_invitations_created_by ON family_invitations(created_by);

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- 全メンバー閲覧可（認証済みユーザー）
-- 招待コードの検証には認証なしでもアクセス可能にする必要があるため、
-- 未認証ユーザーも有効な招待コードの検証のみ許可
CREATE POLICY "invitations_select_authenticated"
  ON family_invitations FOR SELECT
  USING (auth.role() = 'authenticated');

-- 未認証ユーザーでもコード検証のため閲覧可能（ただしcode指定時のみ）
-- Note: この実装はSupabaseのRLSの制限により、別途API側で制御
CREATE POLICY "invitations_select_anon"
  ON family_invitations FOR SELECT
  USING (auth.role() = 'anon');

-- 認証済みユーザーのみ作成可
CREATE POLICY "invitations_insert"
  ON family_invitations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- 作成者のみ更新可（無効化など）
CREATE POLICY "invitations_update"
  ON family_invitations FOR UPDATE
  USING (auth.uid() = created_by);

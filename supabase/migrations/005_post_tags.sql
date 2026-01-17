-- =============================================
-- Post Tags Table for Photo Tagging Feature
-- =============================================

-- post_tags: 投稿への家族メンバータグ付け
-- - 1投稿に複数のメンバーをタグ付け可能
-- - 同一投稿に同一メンバーの重複タグは不可
CREATE TABLE post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, member_id)
);

-- =============================================
-- Indexes
-- =============================================
-- メンバーでのフィルタリング高速化
CREATE INDEX idx_post_tags_member_id ON post_tags(member_id);
-- 投稿ごとのタグ取得用
CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

-- 全メンバー閲覧可（認証済みユーザー）
CREATE POLICY "post_tags_select"
  ON post_tags FOR SELECT
  USING (auth.role() = 'authenticated');

-- 投稿者のみタグ追加可能
CREATE POLICY "post_tags_insert"
  ON post_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_id
      AND posts.user_id = auth.uid()
    )
  );

-- 投稿者のみタグ削除可能
CREATE POLICY "post_tags_delete"
  ON post_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_id
      AND posts.user_id = auth.uid()
    )
  );

-- =============================================
-- Growth Milestones Table for Monthly Record Feature
-- =============================================

-- growth_milestones: 成長メモ（できるようになったこと）
CREATE TABLE growth_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  recorded_at DATE NOT NULL,  -- 月を表す（YYYY-MM-01 形式）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes
-- =============================================
-- 月別取得を高速化するための複合インデックス
CREATE INDEX idx_growth_milestones_child_month ON growth_milestones(child_id, recorded_at);

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE growth_milestones ENABLE ROW LEVEL SECURITY;

-- 認証ユーザーのみ閲覧可能
CREATE POLICY "Authenticated users can view growth_milestones"
  ON growth_milestones FOR SELECT
  USING (auth.role() = 'authenticated');

-- 認証ユーザーは作成可能
CREATE POLICY "Authenticated users can create growth_milestones"
  ON growth_milestones FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 認証ユーザーは削除可能
CREATE POLICY "Authenticated users can delete growth_milestones"
  ON growth_milestones FOR DELETE
  USING (auth.role() = 'authenticated');

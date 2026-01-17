# Research & Design Decisions

## Summary
- **Feature**: `family-account-management`
- **Discovery Scope**: Extension（既存システムへの機能追加）
- **Key Findings**:
  - 既存のprofilesテーブルにroleフィールド（admin/editor）が存在、拡張が必要
  - Supabase Auth + Google OAuth/Email OTPの認証基盤を活用可能
  - 設定画面はモーダルベースのUI、このパターンを継承

## Research Log

### 既存データベース構造の分析
- **Context**: 家族メンバー管理機能を追加するにあたり、既存スキーマとの整合性を確認
- **Sources Consulted**: `supabase/migrations/`内のマイグレーションファイル
- **Findings**:
  - `profiles`テーブル: id, name, avatar_url, role('admin'/'editor'), created_at, updated_at
  - `posts`テーブル: user_id (profiles.id)への外部キー
  - RLS（Row Level Security）が全テーブルで有効
  - auth.usersからprofilesへの自動作成トリガーが存在
- **Implications**:
  - family_membersテーブルを新設し、profiles.idと紐付け
  - 既存のroleフィールドは権限管理用、家族役割は別管理

### 認証フローの分析
- **Context**: 招待経由での新規ユーザー登録フローを設計するため
- **Sources Consulted**: `src/lib/supabase/`, `src/app/auth/callback/`
- **Findings**:
  - Google OAuth: リダイレクト → /auth/callback → セッション確立
  - Email OTP: マジックリンク → /auth/callback → セッション確立
  - サーバーサイドセッション管理（Next.js cookies）
  - AuthProvider経由でクライアント側状態管理
- **Implications**:
  - 招待リンクに招待コードをクエリパラメータとして含める
  - /auth/callbackで招待コード検証後、役割選択画面へリダイレクト

### UI/UXパターンの分析
- **Context**: 家族メンバー管理UIの設計指針を確立
- **Sources Consulted**: `src/components/settings/`, `src/app/settings/`
- **Findings**:
  - 設定画面はModalManagerでモーダル管理
  - ProfileModal, ChildModal等のサブモーダル構成
  - useToast()でフィードバック表示
  - Lucide Reactアイコン使用
- **Implications**:
  - FamilyMemberModalを新設
  - 役割選択はオンボーディング画面として独立ページ
  - モーダル内でメンバー一覧・編集を実装

### 既存フィルタリング機能の分析
- **Context**: タグフィルタリング機能の設計参考
- **Sources Consulted**: `src/components/home/ChildFilter.tsx`
- **Findings**:
  - 子供フィルターはchildIdをURLパラメータで管理
  - 複数選択UI（チップ形式）
  - フィルター状態の視覚的表示
- **Implications**:
  - 家族メンバーフィルターも同様のUIパターンを採用
  - childIdとmemberIdsを組み合わせたフィルタリング

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 既存パターン拡張 | 現行のAPI/Component構造を維持しつつ拡張 | 学習コスト低、一貫性維持 | 特になし | 採用 |
| マイクロサービス分離 | 家族管理を独立サービス化 | スケーラビリティ | 過剰設計、単一テナントには不要 | 不採用 |

## Design Decisions

### Decision: 家族メンバーテーブル設計
- **Context**: 家族メンバーと役割の管理方法
- **Alternatives Considered**:
  1. profilesテーブルにfamily_roleカラム追加
  2. 独立したfamily_membersテーブル新設
- **Selected Approach**: 独立したfamily_membersテーブル
- **Rationale**:
  - profilesのroleは権限管理用（admin/editor）
  - 家族役割は別概念（母、父、祖父母等）
  - 将来的なマルチテナント対応の布石
- **Trade-offs**: テーブル増加、JOIN必要
- **Follow-up**: マイグレーション実行時のデータ整合性確認

### Decision: 招待コード生成方式
- **Context**: セキュアかつユーザーフレンドリーな招待
- **Alternatives Considered**:
  1. UUID（36文字）
  2. カスタム8文字英数字
  3. 短縮URL + UUIDバックエンド
- **Selected Approach**: 8文字英数字（大文字・数字のみ、紛らわしい文字除外）
- **Rationale**: 口頭伝達可能、コピペしやすい
- **Trade-offs**: 衝突リスク（ただし有効期限7日で十分低い）
- **Follow-up**: 生成時に重複チェック実装

### Decision: 写真タグ付けのデータ構造
- **Context**: 投稿と家族メンバーの関連付け
- **Alternatives Considered**:
  1. postsテーブルにtagged_member_ids配列カラム
  2. 独立したpost_tagsテーブル（多対多）
- **Selected Approach**: 独立したpost_tagsテーブル
- **Rationale**:
  - 正規化されたデータ構造
  - インデックスによる効率的なフィルタリング
  - RLSポリシーの適用が容易
- **Trade-offs**: JOIN必要
- **Follow-up**: member_idでのインデックス作成

### Decision: 役割選択UIの配置
- **Context**: 新規ユーザーの役割設定タイミング
- **Alternatives Considered**:
  1. ログイン後のモーダル表示
  2. 独立したオンボーディングページ
- **Selected Approach**: 独立したオンボーディングページ（/onboarding/role）
- **Rationale**:
  - 初回体験として重要なステップ
  - モーダルでは画面が狭い
  - 招待フローと明確に分離
- **Trade-offs**: ルート追加
- **Follow-up**: 役割未設定ユーザーのガード実装

## Risks & Mitigations
- **既存ユーザー移行リスク** — デフォルト役割「その他」で自動登録、初回ログイン時に設定画面表示
- **招待コード悪用リスク** — 有効期限7日、使用回数制限、無効化機能
- **パフォーマンスリスク（タグフィルタリング）** — post_tagsにインデックス作成、クエリ最適化

## References
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js App Router](https://nextjs.org/docs/app)

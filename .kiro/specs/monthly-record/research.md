# Research & Design Decisions

## Summary
- **Feature**: monthly-record
- **Discovery Scope**: Extension（既存システムへの機能追加）
- **Key Findings**:
  - BottomNav は navItems 配列で管理されており、新タブ追加は容易
  - ChildFilter コンポーネントは再利用可能な設計
  - API パターンは Supabase + 認証 + クエリパラメータで統一されている

## Research Log

### 既存ナビゲーション構造
- **Context**: 新しい「月の記録」タブをどこに配置するか
- **Sources Consulted**: `src/components/layout/BottomNav.tsx`
- **Findings**:
  - navItems 配列に `{ href, label, icon }` 形式で定義
  - アクティブ状態は `pathname === item.href` で判定
  - Framer Motion の layoutId でアニメーション実現
- **Implications**: 配列に新項目を追加するだけで実装可能。アイコンは CalendarIcon を新規作成

### 子どもフィルターの再利用性
- **Context**: 月の記録ページでも子どもフィルターが必要
- **Sources Consulted**: `src/components/timeline/ChildFilter.tsx`
- **Findings**:
  - `selectedChildId: string | null` と `onSelect` コールバックで制御
  - null で「全員」を表現
  - 子どもごとの色分け（カイリ: kairi-*, マレ: mare-*）
- **Implications**: そのまま再利用可能。月の記録ページでも同じインターフェースで使用

### API パターン分析
- **Context**: 新規 API エンドポイントの設計パターン確認
- **Sources Consulted**: `src/app/api/posts/route.ts`, `src/app/api/growth-records/route.ts`
- **Findings**:
  - `createClient()` で Supabase クライアント取得
  - `supabase.auth.getUser()` で認証チェック
  - クエリパラメータで `child_id` フィルタリング
  - エラーは `NextResponse.json({ error }, { status })` で返却
- **Implications**: 同じパターンで `/api/monthly/[year]/[month]` と `/api/growth-milestones` を実装

### データベース型定義
- **Context**: 新規テーブル `growth_milestones` の型定義方法
- **Sources Consulted**: `src/types/database.ts`
- **Findings**:
  - `Database.public.Tables` に Row/Insert/Update 型を定義
  - Relationships で FK 関係を明示
  - Helper types で `GrowthMilestone` などをエクスポート
- **Implications**: 同じパターンで growth_milestones 型を追加

### アニメーションパターン
- **Context**: 月切り替え時のアニメーション
- **Sources Consulted**: `src/lib/animations.ts`
- **Findings**:
  - `transitions.smooth`, `transitions.spring` など共通定義あり
  - `slideUp`, `fadeIn` などの Variants が用意されている
  - 月切り替えには `slideUp` が適切
- **Implications**: 既存の transitions と Variants を活用

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 単一ページ + 動的ルート | `/monthly` と `/monthly/[year]/[month]/photos` | Next.js App Router の標準パターン | なし | 採用 |
| 統合 API | 月データを1回で取得 | リクエスト数削減 | レスポンスサイズ増加の可能性 | 採用（写真数に上限設定） |

## Design Decisions

### Decision: 月の表現方法
- **Context**: recorded_at カラムで月をどう表現するか
- **Alternatives Considered**:
  1. `YYYY-MM-01` 形式で月初日を保存
  2. `YYYY-MM` 形式の文字列
- **Selected Approach**: `YYYY-MM-01` 形式（DATE 型）
- **Rationale**: PostgreSQL の DATE 型で比較演算が容易、既存の growth_records.recorded_at と同じ形式
- **Trade-offs**: 日付部分は常に 01 で意味を持たないが、型の一貫性を優先

### Decision: 写真のランダム選択
- **Context**: メイン写真をランダムで選ぶタイミング
- **Alternatives Considered**:
  1. サーバーサイドでランダム選択
  2. クライアントサイドでランダム選択
- **Selected Approach**: クライアントサイド（ページロード時に `Math.random()` でインデックス選択）
- **Rationale**: API レスポンスをキャッシュ可能、実装がシンプル
- **Trade-offs**: 同じデータでも表示が変わるため、SSR 時の hydration mismatch に注意

### Decision: 月別データ API の構造
- **Context**: 写真・成長記録・成長メモを別々に取得するか一括か
- **Alternatives Considered**:
  1. 3つの API を個別に呼び出し
  2. 統合 API で一括取得
- **Selected Approach**: 統合 API `/api/monthly/[year]/[month]`
- **Rationale**: ウォーターフォール回避、初期表示の高速化
- **Trade-offs**: API が複雑化するが、月の記録ページ専用なので許容範囲

## Risks & Mitigations
- **Risk 1**: ナビゲーション項目が5つになりスペースが狭くなる
  - **Mitigation**: アイコンサイズとラベルフォントサイズは既存のまま維持
- **Risk 2**: 写真が多い月でレスポンスが大きくなる
  - **Mitigation**: 月の記録ページでは最大10枚まで取得、ギャラリーでページング
- **Risk 3**: 成長メモ削除時の確認不足
  - **Mitigation**: 長押し後に確認ダイアログを表示

## References
- [Next.js App Router Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Framer Motion Variants](https://www.framer.com/motion/animation/#variants)

# Research & Design Decisions

## Summary
- **Feature**: new-home
- **Discovery Scope**: Extension（既存システムの拡張）
- **Key Findings**:
  - 既存の月別ページ（/monthly）の概念を拡張し、ホーム画面として再構成
  - Supabaseのposts/reactionsテーブルをベースに代表画像選出アルゴリズムを実装可能
  - 既存のChildFilter/MonthSelectorコンポーネントを再利用・拡張

## Research Log

### 既存ホーム画面の構造
- **Context**: 現在のホーム画面からどの程度変更が必要か
- **Sources Consulted**: `src/app/page.tsx`, `src/components/TimelineFeed.tsx`
- **Findings**:
  - 現在はタイムラインフィード形式（Instagram風）
  - `TimelineFeed`コンポーネントで無限スクロール実装
  - `ChildFilter`で子どもごとのフィルタリング対応
  - Realtime購読でリアクション数を動的更新
- **Implications**: ホーム画面を完全に置き換え、月別ナビゲーション中心の設計に変更

### 月別データ取得API
- **Context**: 新ホーム画面で使用するデータソース
- **Sources Consulted**: `src/app/api/monthly/[year]/[month]/route.ts`
- **Findings**:
  - `GET /api/monthly/[year]/[month]`で月別写真を取得可能
  - パラメータ: `childId`（任意）でフィルタリング
  - レスポンス: `{ photos: Photo[], growthRecords, milestones }`
- **Implications**: 既存APIを拡張して代表画像・年別一覧取得を追加

### UIコンポーネントパターン
- **Context**: 再利用可能なコンポーネントの特定
- **Sources Consulted**: `src/components/monthly/`, `src/components/home/`
- **Findings**:
  - `MonthSelector`: 前後月ナビゲーション（矢印ボタン形式）
  - `PhotoGrid`: 3カラムのグリッド表示
  - `PhotoDisplay`: メイン画像＋サムネイル形式
  - `ChildFilter`: 横スクロールタブ
  - `AnimatedCard`: Framer Motionベースのカード
- **Implications**: MonthSelectorを月タブに拡張、PhotoGridは再利用

### データベース構造
- **Context**: 代表画像選出に必要なデータ
- **Sources Consulted**: Supabaseスキーマ、`src/lib/supabase/`
- **Findings**:
  - `posts`テーブル: media_url, created_at, child_id
  - `reactions`テーブル: post_id, user_id（Like数カウント可能）
  - 現時点で「カバー設定」「閲覧数」フィールドは存在しない
- **Implications**:
  - Phase 1: reaction_countとcreated_atのみで代表画像選出
  - Phase 2（将来）: is_cover, view_countフィールド追加検討

### スワイプジェスチャー実装
- **Context**: 月間移動のスワイプ操作
- **Sources Consulted**: Framer Motion documentation
- **Findings**:
  - `useDragControls`と`onDragEnd`で左右スワイプ検出可能
  - `AnimatePresence`で月間切り替えアニメーション実装
  - 既存プロジェクトでFramer Motion 12.23.26使用中
- **Implications**: Framer Motionのドラッグ機能で実装、追加ライブラリ不要

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| コンポーネント分離 | ホーム画面を複数の独立したコンポーネントに分割 | テスト容易、並行開発可能 | Props drilling可能性 | 採用 |
| Context API | 年月状態をContext経由で共有 | 状態管理シンプル | 過剰なre-render | 採用（限定的） |
| URL State | URLパラメータで年月を管理 | ブックマーク可能、SEO | ナビゲーション複雑化 | 年アーカイブのみ |

## Design Decisions

### Decision: 代表画像選出アルゴリズム（簡易版）
- **Context**: 要件4.1の代表画像選出を実装
- **Alternatives Considered**:
  1. 完全実装（カバー設定＋Like数＋閲覧数＋最新）
  2. 簡易実装（Like数＋最新のみ）
- **Selected Approach**: 簡易実装
- **Rationale**: 現時点でis_cover/view_countフィールドが存在しない。DBスキーマ変更なしで実装可能
- **Trade-offs**: ユーザー指定カバー機能は将来対応
- **Follow-up**: スキーマ拡張後にアルゴリズム更新

### Decision: 年月状態管理
- **Context**: 年タブ・月タブの状態をどこで管理するか
- **Alternatives Considered**:
  1. URL params（/home/2025/01）
  2. useState（クライアント状態）
  3. Context API
- **Selected Approach**: useState + URLは年アーカイブ画面のみ
- **Rationale**: ホーム画面はデフォルト当月表示が要件。URL管理するとブラウザバックの挙動が複雑化
- **Trade-offs**: ブックマーク不可だが、ユースケース的に問題なし

### Decision: 3階層構造の実装
- **Context**: ALL→Year→Month→Imagesの階層遷移
- **Alternatives Considered**:
  1. 別ページ遷移（/archive, /archive/2025）
  2. モーダル/オーバーレイ
  3. 同一画面内で切り替え
- **Selected Approach**: 同一画面内で切り替え（モード切り替え）
- **Rationale**: UXの一貫性、スムーズなアニメーション遷移
- **Trade-offs**: 状態管理がやや複雑になるが、Framer Motionで対応可能

## Risks & Mitigations
- **パフォーマンス**: 大量の画像グリッド表示 → 仮想スクロール検討、Next.js Image最適化活用
- **初回ロード**: 当月データ取得待ち → SSRまたはStreaming活用
- **スワイプ精度**: スクロールとスワイプの誤判定 → しきい値調整、縦スクロールとの区別

## References
- [Framer Motion Drag Gesture](https://www.framer.com/motion/gestures/) - スワイプ実装参考
- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image) - 画像最適化
- 既存実装: `src/app/monthly/page.tsx` - 月別ページ参照パターン

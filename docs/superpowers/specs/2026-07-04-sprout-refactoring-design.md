# sprout 全体リファクタリング設計書

日付: 2026-07-04
起点ブランチ: `issue-71v4`(写真タグ付け機能を含む現行状態)
作業ブランチ: `refactor/cleanup`

## 背景と目的

リポジトリ作成から時間が経ち、以下の課題がある。

- APIルート約25本すべてで認証チェック・エラーレスポンスのボイラープレートが重複している
- `HomeGallery.tsx`(495行)、`admin/page.tsx`(462行)など複数のコンポーネントが肥大化している
- テストは `src/lib/api/` の純粋ロジック層(78件)のみで、APIルートとコンポーネントは未テスト
- 開発体制を kiro から superpowers に切り替えるため、kiro関連の起動物(CLAUDE.md の指示、スラッシュコマンド)が不要になった

目的: バグを出さずにコードを整理し、今後の追加改修がスムーズに進む状態にする。

## 現状(2026-07-04 時点)

- Next.js 16 / React 19 / Supabase / Tailwind 3 / Vitest 4 / Playwright
- src 配下 121 ファイル、約13,000行
- TypeScript 型チェック: エラーなし
- ユニットテスト: 78件すべてパス
- アプリはデプロイ済みだがほぼ未使用(実データの制約は緩い)

## ゴールと不変条件

- **外部契約は維持する**: APIレスポンス形状・DBスキーマ・画面挙動は変更しない。純粋な内部リファクタリングとする
- **各ステップ後に `npx tsc --noEmit` / `npm run lint` / `npm test` の全パスを確認**してからコミットする。壊れた状態のコミットを作らない
- 依存パッケージの更新はスコープ外(今回は行わない)

## Phase 0: 開発基盤の切り替え(kiro → superpowers)

- `.claude/commands/kiro/`(11個のスラッシュコマンド)を削除する
- `CLAUDE.md` を全面書き換える: kiro指示を撤去し、プロジェクト概要・技術スタック・開発コマンド(dev/test/lint)・アーキテクチャ規約を簡潔に記載する
- `.kiro/specs/` の設計ドキュメント4件(family-account-management / monthly-record / new-home / sprout-family-sns)と `.kiro/steering/testing.md` は `docs/kiro-archive/` に移動して保存する
- `.kiro/settings/`(rules/templates)は撤去し、`.kiro/` ディレクトリ自体を削除する
- `.claude/skills/frontend-design` は残す

## Phase 1: 安全網の構築(特性テスト)

現在の挙動をそのまま固定する特性テストをAPIルート約25本に追加する。リファクタリング前に書くことで、以降の変更で退行が入れば即検知できる。

- **テスト方式**: `vi.mock("@/lib/supabase/server")` でSupabaseクライアントをモックし、ルートハンドラ(GET/POST/PATCH/DELETE)を直接呼び出すユニットテスト。既存の vitest / node 環境をそのまま使い、新規依存は追加しない
- **共通ヘルパー**: `src/test/supabase-mock.ts` を新設し、クエリビルダーのチェーンモックと認証状態のセットアップを一元化する
- **各ルートで固定する挙動**:
  - 未認証 → 401
  - バリデーション失敗 → 400
  - 成功時のレスポンス形状(ステータスコードとJSONのキー構造)
  - DBエラー → 500
- **分担**: ドメイン単位でサブエージェントに並列委譲する
  1. posts系(posts / comments / reactions / tags)
  2. family系(children / family-members / invitations / profile)
  3. monthly・growth系(monthly / growth-records / growth-milestones / featured / years)
  4. admin・その他(admin/users / upload / ai/caption)

## Phase 2: 構造リファクタリング

Phase 1 のテストを緑に保ったまま実施する。

### 2-1. APIルートの共通化

`src/lib/api/route-helpers.ts` を新設する。

- `requireUser()`: 認証チェック。未認証なら401レスポンスを返す
- `jsonError()`: 統一エラーレスポンス生成
- リクエストボディ検証ヘルパー

全ルートをこれらのヘルパーを使う薄い実装に書き換え、重複ボイラープレートを排除する。レスポンス形状は変更しない。

### 2-2. 肥大コンポーネントの分割

目安250行超の上位ファイルを、サブコンポーネント+カスタムフックに分割する。ロジックは既存の `src/lib/api/`「純粋ロジック+テスト」パターンに寄せて抽出し、抽出したロジックにはテストを付ける。

対象(現時点の行数):

- `src/components/home/HomeGallery.tsx`(495行)
- `src/app/admin/page.tsx`(462行)
- `src/components/upload/UploadForm.tsx`(389行)
- `src/app/invite/[code]/page.tsx`(268行)
- `src/components/growth/GrowthChart.tsx`(263行)
- `src/components/timeline/TimelineFeed.tsx`(257行)
- `src/app/onboarding/role/page.tsx`(244行)
- `src/components/timeline/CommentSection.tsx`(237行)

### 2-3. 最終検証

- `npm run build` の成功
- 全ユニットテストのパス
- Playwright e2e はローカルSupabaseの起動が必要なため、環境が動く場合のみ実行する

## 体制

- リーダー(Fable): タスク分解・レビュー・検証コマンドの実行を担当
- 実装(Sonnet サブエージェント): 特性テスト作成・APIルートの機械的な書き換えを並列で担当
- 設計判断を伴う分割(Opus サブエージェント): HomeGallery など構造判断が必要なコンポーネント分割を担当
- すべての成果物はリーダーがレビューし、検証コマンドを通してからコミットする

## エラー処理・リスク対応

- サブエージェントの成果物がテストを壊した場合: 差し戻すか、リーダーが直接修正する
- 特性テスト作成中に既存バグを発見した場合: 挙動を変えず、まず現状の挙動でテストを固定し、バグは別途リストアップしてユーザーに報告する(このリファクタリング内では修正しない)
- コミットは小さい単位(ルートグループ単位・コンポーネント単位)で行い、問題発生時に巻き戻せるようにする

# sprout

家族向け写真共有SNS。子どもの写真をタイムライン・月別ギャラリー・成長記録として家族で共有する。

## 技術スタック

- Next.js 16 (App Router) / React 19 / TypeScript 5
- Supabase (認証・DB。サーバーは `@/lib/supabase/server` の `createClient`)
- Cloudflare R2 (画像ストレージ、presigned URL方式。`@/lib/r2`)
- Google Gemini (AIキャプション生成。`@/lib/gemini`)
- Tailwind CSS 3 / framer-motion / recharts

## コマンド

- `npm run dev` — 開発サーバー
- `npm test` — ユニットテスト (Vitest)
- `npm run lint` — ESLint
- `npx tsc --noEmit` — 型チェック
- `npm run test:e2e` — Playwright E2E (ローカルSupabase起動が必要)

## アーキテクチャ規約

- APIルート (`src/app/api/**/route.ts`) は薄く保つ。認証は `requireUser()`、エラーレスポンスは `jsonError()` (`@/lib/api/route-helpers`) を使う
- ビジネスロジックは `src/lib/` に純粋関数として置き、ユニットテストを併設する (`foo.ts` + `foo.test.ts`)
- コンポーネントは250行を超えたら分割を検討。データ取得ロジックはカスタムフックに抽出する
- APIルートには特性テスト (`route.test.ts`) がある。ルート変更時はテストも更新する
- テストの describe/it は日本語で書く

## 開発ルール

- コミット前に `npx tsc --noEmit` / `npm run lint` / `npm test` を通す
- 過去のkiro時代の設計ドキュメントは `docs/kiro-archive/` にある

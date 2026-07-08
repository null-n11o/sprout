# sprout

Family photo sharing app for sharing children's photos through a timeline,
monthly galleries, and growth records.

## Stack

- Next.js 16 App Router, React 19, TypeScript 5
- Supabase for auth and database access
- Cloudflare R2 for image storage with presigned URLs
- Google Gemini for AI caption generation
- Tailwind CSS 3, framer-motion, recharts

## Commands

- `npm run dev` - start the local Next.js development server
- `npm run build` - production build
- `npm run lint` - ESLint
- `npm test` - Vitest unit and route tests
- `npx tsc --noEmit` - TypeScript check
- `npm run test:e2e` - Playwright E2E tests; requires local app dependencies and Supabase state

Run the narrowest useful verification while iterating. Before handing off broad
code changes, prefer `npx tsc --noEmit`, `npm run lint`, and `npm test` unless
the change is documentation-only or the user asks for a different scope.

## Architecture

- Keep API route handlers in `src/app/api/**/route.ts` thin.
- Use `requireUser()` and `jsonError()` from `@/lib/api/route-helpers` for
  authenticated API routes and error responses.
- Put business logic in `src/lib/` as testable functions. Co-locate tests as
  `foo.test.ts` or `foo.test.tsx`.
- API routes should have behavior tests in matching `route.test.ts` files.
  Update those tests when route behavior changes.
- Split React components when they become hard to scan. Move data loading and
  workflow state into custom hooks when that matches the surrounding pattern.
- Test `describe` and `it` labels are written in Japanese.

## Repository Notes

- The Supabase schema and local config live under `supabase/`.
- Historical Kiro design documents live under `docs/kiro-archive/`.
- Superpowers planning artifacts live under `.superpowers/`; do not modify them
  unless the task explicitly concerns that workflow.
- Existing Claude-specific guidance lives in `CLAUDE.md`. Keep this file and
  `AGENTS.md` aligned when changing durable project conventions.

## Safety

- Do not read or print `.env.local` values unless the user explicitly asks for
  secret debugging. Use `.env.local.example` for required variable names.
- Do not commit, push, or deploy unless the user explicitly asks.
- Do not overwrite user changes. Check `git status --short` before editing when
  the work may touch files outside the immediate request.

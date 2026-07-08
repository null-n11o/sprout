# sprout 全体リファクタリング実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** kiro開発基盤をsuperpowersに切り替え、APIルート全25本に特性テストの安全網を張ったうえで、重複ボイラープレートの共通化と肥大コンポーネントの分割を行う。

**Architecture:** (1) kiro撤去 → (2) 現挙動を固定する特性テスト追加 → (3) テストを緑に保ったまま構造リファクタリング、の3フェーズ。外部契約(APIレスポンス形状・DBスキーマ・画面挙動)は一切変更しない。

**Tech Stack:** Next.js 16 (App Router) / React 19 / Supabase (@supabase/ssr) / Vitest 4 / TypeScript 5

## Global Constraints

- 依存パッケージの追加・更新・削除は行わない
- APIレスポンスの形状・ステータスコード・エラーメッセージ文字列は現状を厳密に維持する
- 各タスク完了時に `npx tsc --noEmit` と `npm test` が全パスすること。lintは `npm run lint` で警告以上を出さないこと
- コミットは1タスク1コミット以上の小さい単位で行う
- コミットメッセージ末尾: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- テストコード内の describe/it 文言は日本語で書く(既存テストの慣習に合わせる)
- 特性テスト作成中に既存バグを発見した場合: 挙動を変えず現状のままテストで固定し、バグ内容を最終報告用にメモする(この計画内では修正しない)

---

### Task 0: 準備(未コミット変更の整理と作業ブランチ作成)

**Files:**
- Commit: `supabase/config.toml`(既存の未コミット変更)

**Interfaces:**
- Produces: 作業ブランチ `refactor/cleanup`(以降の全タスクはこのブランチ上で行う)

- [ ] **Step 1: 未コミット変更の内容確認**

Run: `git diff supabase/config.toml`
Expected: Mailpit/SMTP関連の設定変更のみ(想定外の差分があれば作業を止めてユーザーに確認)

- [ ] **Step 2: コミットとブランチ作成**

```bash
git add supabase/config.toml
git commit -m "chore: supabase config.tomlの設定変更をコミット"
git checkout -b refactor/cleanup
```

- [ ] **Step 3: ベースライン確認**

Run: `npx tsc --noEmit && npm test`
Expected: 型エラーなし、78テスト全パス

---

### Task 1: kiro → superpowers 移行

**Files:**
- Delete: `.claude/commands/kiro/`(配下11ファイルごと)
- Move: `.kiro/specs/family-account-management/` → `docs/kiro-archive/specs/family-account-management/`
- Move: `.kiro/specs/monthly-record/` → `docs/kiro-archive/specs/monthly-record/`
- Move: `.kiro/specs/new-home/` → `docs/kiro-archive/specs/new-home/`
- Move: `.kiro/specs/sprout-family-sns/` → `docs/kiro-archive/specs/sprout-family-sns/`
- Move: `.kiro/steering/testing.md` → `docs/kiro-archive/steering/testing.md`
- Delete: `.kiro/`(settings/rules/templatesを含む残り全部)
- Rewrite: `CLAUDE.md`

**Interfaces:**
- Produces: kiroに依存しない起動環境。`docs/kiro-archive/` に過去の設計ドキュメントを保存

- [ ] **Step 1: アーカイブ移動と削除**

```bash
mkdir -p docs/kiro-archive/specs docs/kiro-archive/steering
git mv .kiro/specs/family-account-management docs/kiro-archive/specs/
git mv .kiro/specs/monthly-record docs/kiro-archive/specs/
git mv .kiro/specs/new-home docs/kiro-archive/specs/
git mv .kiro/specs/sprout-family-sns docs/kiro-archive/specs/
git mv .kiro/steering/testing.md docs/kiro-archive/steering/
git rm -r .claude/commands/kiro
git rm -r .kiro
```

注意: `.kiro` 配下に未追跡ファイルが残って `git rm` が失敗した場合は内容を確認し、不要なら `rm -rf .kiro` で削除する。

- [ ] **Step 2: CLAUDE.md を全面書き換え**

以下の内容で `CLAUDE.md` を置き換える:

```markdown
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
```

- [ ] **Step 3: 検証とコミット**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: 全パス

```bash
git add -A
git commit -m "chore: kiro開発基盤を撤去しsuperpowersに移行

- .claude/commands/kiro と .kiro を削除
- 過去の設計ドキュメントは docs/kiro-archive/ に保存
- CLAUDE.md をプロジェクト概要・規約ベースに書き換え"
```

---

### Task 2: Supabaseモックヘルパー + 模範特性テスト (children)

**Files:**
- Create: `src/test/supabase-mock.ts`
- Create: `src/app/api/children/route.test.ts`
- Reference: `src/app/api/children/route.ts`(変更しない)

**Interfaces:**
- Produces:
  - `createSupabaseMock(options: { user?: { id: string; email?: string } | null; tables?: Record<string, TableResult | TableResult[]> }): SupabaseMock` — `auth.getUser()` と `from(table)` のチェーンモックを持つオブジェクト。`tables` に配列を渡すと同一テーブルへのN回目の `from()` 呼び出しにN番目の結果を返す
  - `type TableResult = { data?: unknown; error?: unknown; count?: number | null }`
  - 全特性テスト(Task 3〜6)はこのヘルパーとこの模範テストのパターンに従う

- [ ] **Step 1: モックヘルパーを作成**

`src/test/supabase-mock.ts`:

```typescript
import { vi } from "vitest";

export interface TableResult {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}

const CHAIN_METHODS = [
  "select", "insert", "update", "delete", "upsert",
  "eq", "neq", "in", "is", "not", "or",
  "lt", "lte", "gt", "gte", "like", "ilike", "contains",
  "order", "limit", "range", "single", "maybeSingle",
] as const;

/**
 * Supabaseクエリビルダーのチェーンモック。
 * どのメソッドを呼んでも自身を返し、awaitすると result を解決する。
 */
export function createChainMock(result: TableResult = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  for (const method of CHAIN_METHODS) {
    chain[method] = vi.fn(() => chain);
  }
  chain.then = (
    resolve: (value: TableResult) => unknown,
    reject?: (reason: unknown) => unknown
  ) =>
    Promise.resolve({ data: null, error: null, count: null, ...result }).then(
      resolve,
      reject
    );
  return chain;
}

export interface SupabaseMockOptions {
  /** null または省略で未認証状態 */
  user?: { id: string; email?: string } | null;
  /** テーブル名 → 結果。配列を渡すと from() の呼び出し回数順に消費される */
  tables?: Record<string, TableResult | TableResult[]>;
}

export function createSupabaseMock(options: SupabaseMockOptions = {}) {
  const callCounts: Record<string, number> = {};

  return {
    auth: {
      getUser: vi.fn(async () =>
        options.user
          ? { data: { user: options.user }, error: null }
          : { data: { user: null }, error: { message: "Not authenticated" } }
      ),
    },
    from: vi.fn((table: string) => {
      const entry = options.tables?.[table];
      if (Array.isArray(entry)) {
        const index = callCounts[table] ?? 0;
        callCounts[table] = index + 1;
        return createChainMock(entry[Math.min(index, entry.length - 1)]);
      }
      return createChainMock(entry);
    }),
  };
}

export type SupabaseMock = ReturnType<typeof createSupabaseMock>;
```

- [ ] **Step 2: children ルートの特性テストを書く**

`src/app/api/children/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseMock } from "@/test/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { GET, POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

function setSupabase(mock: ReturnType<typeof createSupabaseMock>) {
  mockCreateClient.mockResolvedValue(mock as never);
}

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/children", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/children", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("認証済みなら子ども一覧を返す", async () => {
    const children = [
      { id: "c1", name: "太郎", birth_date: "2023-01-01", avatar_url: null, gender: "male" },
    ];
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { children: { data: children } },
      })
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ children });
  });

  it("DBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { children: { data: null, error: { message: "db down" } } },
      })
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch children" });
  });
});

describe("POST /api/children", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await POST(postRequest({ name: "太郎", birth_date: "2023-01-01" }));

    expect(response.status).toBe(401);
  });

  it("nameがなければ400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(postRequest({ birth_date: "2023-01-01" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Name is required" });
  });

  it("birth_dateがなければ400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(postRequest({ name: "太郎" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Birth date is required" });
  });

  it("作成に成功したら201でchildを返す", async () => {
    const child = { id: "c1", name: "太郎", birth_date: "2023-01-01" };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { children: { data: child } },
      })
    );

    const response = await POST(postRequest({ name: "太郎", birth_date: "2023-01-01" }));
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual({ child });
  });

  it("insertが失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { children: { data: null, error: { message: "constraint" } } },
      })
    );

    const response = await POST(postRequest({ name: "太郎", birth_date: "2023-01-01" }));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to create child" });
  });
});
```

- [ ] **Step 3: テスト実行**

Run: `npx vitest run src/app/api/children/route.test.ts`
Expected: 8テスト全パス。失敗した場合はモックヘルパーがルートの実際のクエリチェーンと合っていないので、`route.ts` を読んでヘルパー側を直す(ルートは変更しない)

- [ ] **Step 4: 全体検証とコミット**

Run: `npx tsc --noEmit && npm test`
Expected: 全パス

```bash
git add src/test/supabase-mock.ts src/app/api/children/route.test.ts
git commit -m "test: Supabaseモックヘルパーとchildrenルートの特性テストを追加"
```

---

### Task 3: posts系ルートの特性テスト

**Files:**
- Create: `src/app/api/posts/route.test.ts`
- Create: `src/app/api/posts/[id]/route.test.ts`
- Create: `src/app/api/posts/[id]/comments/route.test.ts`
- Create: `src/app/api/posts/[id]/comments/[commentId]/route.test.ts`
- Create: `src/app/api/posts/[id]/reactions/route.test.ts`
- Create: `src/app/api/posts/[id]/tags/route.test.ts`
- Reference: 各 `route.ts`(変更しない)、`src/test/supabase-mock.ts`、模範 `src/app/api/children/route.test.ts`

**Interfaces:**
- Consumes: `createSupabaseMock` / `TableResult`(Task 2)
- Produces: posts系全ルートの挙動を固定する特性テスト

**書き方(全ルート共通の必須手順):**

1. まず対象の `route.ts` を通読し、エクスポートされている全HTTPメソッドと、全分岐(認証・バリデーション・DBエラー・成功)を洗い出す
2. Task 2 の `src/app/api/children/route.test.ts` と同一のパターンでテストを書く: `vi.mock("@/lib/supabase/server")` → `createSupabaseMock` で状態を組み立て → ハンドラを直接呼ぶ → status と JSON を厳密に assert
3. **期待値(ステータスコード・エラーメッセージ文字列・レスポンスのキー構造)は必ず `route.ts` の実装から書き写す。**推測で書かない。現挙動が変に見えてもそのまま固定し、気づいた点はメモに残す
4. 動的ルートのハンドラ第2引数は `{ params: Promise.resolve({ id: "post-1" }) }` の形で渡す(`route.ts` の実際のシグネチャを確認して合わせる)
5. 同一リクエスト内で同じテーブルに複数回アクセスするルートは `tables: { posts: [result1, result2] }` の配列形式を使う
6. クエリパラメータは `new NextRequest("http://localhost/api/posts?cursor=...&child_id=...")` のURLで渡す

**各ルートで最低限カバーする分岐:**

- 全メソッド: 未認証 → 401
- ボディ/パラメータ検証のある全メソッド: 検証失敗 → 400(実装のメッセージ文字列を厳密に)
- 全メソッド: 成功時のステータスコードとJSONキー構造
- 全メソッド: DBエラー → 500(実装のメッセージ文字列を厳密に)
- 所有者チェック・権限チェックがあるルート(comments/[commentId] の削除など): 権限なし → 403 または実装どおりのステータス

- [ ] **Step 1:** `posts/route.ts` を読み、`posts/route.test.ts` を上記手順で作成
- [ ] **Step 2:** Run: `npx vitest run src/app/api/posts/route.test.ts` → 全パス
- [ ] **Step 3:** `posts/[id]/route.ts` を読み、`posts/[id]/route.test.ts` を作成 → 実行して全パス
- [ ] **Step 4:** `posts/[id]/comments/route.ts` → テスト作成 → 全パス
- [ ] **Step 5:** `posts/[id]/comments/[commentId]/route.ts` → テスト作成 → 全パス
- [ ] **Step 6:** `posts/[id]/reactions/route.ts` → テスト作成 → 全パス
- [ ] **Step 7:** `posts/[id]/tags/route.ts` → テスト作成 → 全パス(このルートは269行あり分岐が多い。全分岐を洗い出すこと)
- [ ] **Step 8: 全体検証とコミット**

Run: `npx tsc --noEmit && npm test`
Expected: 全パス

```bash
git add src/app/api/posts
git commit -m "test: posts系APIルートの特性テストを追加"
```

---

### Task 4: family系ルートの特性テスト

**Files:**
- Create: `src/app/api/family-members/route.test.ts`
- Create: `src/app/api/family-members/me/route.test.ts`
- Create: `src/app/api/invitations/route.test.ts`
- Create: `src/app/api/invitations/[code]/route.test.ts`
- Create: `src/app/api/profile/route.test.ts`
- Create: `src/app/api/children/[id]/route.test.ts`
- Reference: 各 `route.ts`(変更しない)、`src/test/supabase-mock.ts`、模範 `src/app/api/children/route.test.ts`

**Interfaces:**
- Consumes: `createSupabaseMock` / `TableResult`(Task 2)
- Produces: family系全ルートの特性テスト

**書き方:** Task 3 の「書き方(全ルート共通の必須手順)」「各ルートで最低限カバーする分岐」とまったく同じ手順に従う。模範は `src/app/api/children/route.test.ts`。

補足:
- `family-members/route.ts`(221行)と `invitations` 系はロジック層 `src/lib/api/family-members.ts` / `invitations.ts` を使っている。ロジック層はモックせず、Supabaseクライアントのモックだけで貫通させる(ロジック層自体のテストは既存)
- 招待コードの有効期限切れなど時間依存の分岐がある場合は `vi.useFakeTimers()` + `vi.setSystemTime()` で固定する

- [ ] **Step 1:** `family-members/route.ts` を読み、テスト作成 → `npx vitest run src/app/api/family-members/route.test.ts` 全パス
- [ ] **Step 2:** `family-members/me/route.ts` → テスト作成 → 全パス
- [ ] **Step 3:** `invitations/route.ts` → テスト作成 → 全パス
- [ ] **Step 4:** `invitations/[code]/route.ts` → テスト作成 → 全パス
- [ ] **Step 5:** `profile/route.ts` → テスト作成 → 全パス
- [ ] **Step 6:** `children/[id]/route.ts` → テスト作成 → 全パス
- [ ] **Step 7: 全体検証とコミット**

Run: `npx tsc --noEmit && npm test`
Expected: 全パス

```bash
git add src/app/api/family-members src/app/api/invitations src/app/api/profile src/app/api/children
git commit -m "test: family系APIルートの特性テストを追加"
```

---

### Task 5: monthly・growth系ルートの特性テスト

**Files:**
- Create: `src/app/api/monthly/[year]/route.test.ts`
- Create: `src/app/api/monthly/[year]/[month]/route.test.ts`
- Create: `src/app/api/growth-records/route.test.ts`
- Create: `src/app/api/growth-records/[id]/route.test.ts`
- Create: `src/app/api/growth-milestones/route.test.ts`
- Create: `src/app/api/growth-milestones/[id]/route.test.ts`
- Create: `src/app/api/featured/[year]/[month]/route.test.ts`
- Create: `src/app/api/years/route.test.ts`
- Reference: 各 `route.ts`(変更しない)、`src/test/supabase-mock.ts`、模範 `src/app/api/children/route.test.ts`

**Interfaces:**
- Consumes: `createSupabaseMock` / `TableResult`(Task 2)
- Produces: monthly・growth系全ルートの特性テスト

**書き方:** Task 3 の「書き方(全ルート共通の必須手順)」「各ルートで最低限カバーする分岐」とまったく同じ手順に従う。模範は `src/app/api/children/route.test.ts`。

補足:
- `[year]` / `[month]` パラメータは `{ params: Promise.resolve({ year: "2024", month: "3" }) }` の形で渡す。数値でないパラメータ(`year: "abc"`)の分岐が実装にあればそれも固定する
- これらのルートは `src/lib/api/years.ts` / `featured.ts` などの純粋ロジックを併用している。ロジック層はモックしない

- [ ] **Step 1:** `monthly/[year]/route.ts` → テスト作成 → 全パス
- [ ] **Step 2:** `monthly/[year]/[month]/route.ts` → テスト作成 → 全パス
- [ ] **Step 3:** `growth-records/route.ts` → テスト作成 → 全パス
- [ ] **Step 4:** `growth-records/[id]/route.ts` → テスト作成 → 全パス
- [ ] **Step 5:** `growth-milestones/route.ts` → テスト作成 → 全パス
- [ ] **Step 6:** `growth-milestones/[id]/route.ts` → テスト作成 → 全パス
- [ ] **Step 7:** `featured/[year]/[month]/route.ts` → テスト作成 → 全パス
- [ ] **Step 8:** `years/route.ts` → テスト作成 → 全パス
- [ ] **Step 9: 全体検証とコミット**

Run: `npx tsc --noEmit && npm test`
Expected: 全パス

```bash
git add src/app/api/monthly src/app/api/growth-records src/app/api/growth-milestones src/app/api/featured src/app/api/years
git commit -m "test: monthly・growth系APIルートの特性テストを追加"
```

---

### Task 6: admin・upload・ai系ルートの特性テスト

**Files:**
- Create: `src/app/api/admin/users/route.test.ts`
- Create: `src/app/api/admin/users/[id]/route.test.ts`
- Create: `src/app/api/upload/presign/route.test.ts`
- Create: `src/app/api/ai/caption/route.test.ts`
- Reference: 各 `route.ts`(変更しない)、`src/test/supabase-mock.ts`、模範 `src/app/api/children/route.test.ts`

**Interfaces:**
- Consumes: `createSupabaseMock` / `TableResult`(Task 2)
- Produces: admin・upload・ai系全ルートの特性テスト

**書き方:** Task 3 の「書き方(全ルート共通の必須手順)」「各ルートで最低限カバーする分岐」とまったく同じ手順に従う。模範は `src/app/api/children/route.test.ts`。

このグループ固有の追加モック:

- admin系は `@/lib/supabase/admin` の `createAdminClient` と `@/lib/admin` の `isSuperAdmin` も使う。次のようにモックする:

```typescript
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));
```

`isSuperAdmin` は実装(環境変数またはメールアドレス判定)を読み、モックするか `vi.stubEnv` で環境変数を立てるかを実装に合わせて選ぶ。superAdmin判定を通すケースと弾かれて403になるケースの両方を固定する。`createAdminClient` の返り値にも `createSupabaseMock` を使う(`auth.admin` 系メソッドを使っていれば `as never` キャストの上で必要メソッドを `vi.fn()` で足す)。

- `upload/presign` は `@/lib/r2` の `getPresignedUploadUrl` をモックする:

```typescript
vi.mock("@/lib/r2", () => ({
  getPresignedUploadUrl: vi.fn().mockResolvedValue({
    url: "https://r2.example.com/presigned",
    key: "uploads/test-key",
  }),
}));
```

返り値の形は `src/lib/r2/` の実装を読んで正確に合わせる。ALLOWED_TYPES外のcontent-type → 400 の分岐も固定する。

- `ai/caption` は `@/lib/gemini` の `generateCaption` をモックする。FormData渡しのため、リクエストは次の形で作る:

```typescript
const formData = new FormData();
formData.append("image", new File(["dummy"], "test.png", { type: "image/png" }));
const request = new NextRequest("http://localhost/api/ai/caption", {
  method: "POST",
  body: formData,
});
```

image未添付 → 400、`generateCaption` が throw → 実装どおりのステータス、を固定する。

- [ ] **Step 1:** `admin/users/route.ts` → テスト作成 → 全パス(401 / 403 / 成功 / 環境変数未設定分岐)
- [ ] **Step 2:** `admin/users/[id]/route.ts` → テスト作成 → 全パス
- [ ] **Step 3:** `upload/presign/route.ts` → テスト作成 → 全パス
- [ ] **Step 4:** `ai/caption/route.ts` → テスト作成 → 全パス
- [ ] **Step 5: 全体検証とコミット**

Run: `npx tsc --noEmit && npm test`
Expected: 全パス

```bash
git add src/app/api/admin src/app/api/upload src/app/api/ai
git commit -m "test: admin・upload・ai系APIルートの特性テストを追加"
```

---

### Task 7: route-helpers の作成(TDD)

**Files:**
- Create: `src/lib/api/route-helpers.ts`
- Create: `src/lib/api/route-helpers.test.ts`

**Interfaces:**
- Consumes: `createSupabaseMock`(Task 2)、`@/lib/supabase/server` の `createClient`
- Produces(Task 8〜11 が使用):
  - `jsonError(message: string, status: number): NextResponse` — `{ error: message }` を返す
  - `requireUser(): Promise<AuthResult>` — `AuthResult = { supabase, user, response: null } | { supabase: null, user: null, response: NextResponse }`。`response` が非nullなら401レスポンスなのでそのままreturnする
  - `type ServerSupabase = Awaited<ReturnType<typeof createClient>>`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/api/route-helpers.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { jsonError, requireUser } from "./route-helpers";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("jsonError", () => {
  it("指定したメッセージとステータスのJSONレスポンスを返す", async () => {
    const response = jsonError("Not found", 404);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "Not found" });
  });
});

describe("requireUser", () => {
  it("未認証ならresponseに401を返す", async () => {
    mockCreateClient.mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );

    const result = await requireUser();

    expect(result.user).toBeNull();
    expect(result.response).not.toBeNull();
    expect(result.response!.status).toBe(401);
    expect(await result.response!.json()).toEqual({ error: "Unauthorized" });
  });

  it("認証済みならuserとsupabaseを返しresponseはnull", async () => {
    const mock = createSupabaseMock({ user: { id: "u1", email: "a@b.c" } });
    mockCreateClient.mockResolvedValue(mock as never);

    const result = await requireUser();

    expect(result.response).toBeNull();
    expect(result.user).toEqual({ id: "u1", email: "a@b.c" });
    expect(result.supabase).toBe(mock);
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `npx vitest run src/lib/api/route-helpers.test.ts`
Expected: FAIL(`route-helpers` モジュールが存在しない)

- [ ] **Step 3: 実装**

`src/lib/api/route-helpers.ts`:

```typescript
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export type AuthResult =
  | { supabase: ServerSupabase; user: User; response: null }
  | { supabase: null; user: null; response: NextResponse };

/**
 * 認証チェック。response が非null なら未認証なので、
 * 呼び出し側はそのまま return response する。
 */
export async function requireUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase: null, user: null, response: jsonError("Unauthorized", 401) };
  }

  return { supabase, user, response: null };
}
```

- [ ] **Step 4: テスト通過を確認**

Run: `npx vitest run src/lib/api/route-helpers.test.ts`
Expected: PASS(3テスト)

- [ ] **Step 5: 全体検証とコミット**

Run: `npx tsc --noEmit && npm test`
Expected: 全パス

```bash
git add src/lib/api/route-helpers.ts src/lib/api/route-helpers.test.ts
git commit -m "feat: APIルート共通ヘルパー requireUser / jsonError を追加"
```

---

### Task 8: posts系ルートをヘルパーで書き換え

**Files:**
- Modify: `src/app/api/posts/route.ts`
- Modify: `src/app/api/posts/[id]/route.ts`
- Modify: `src/app/api/posts/[id]/comments/route.ts`
- Modify: `src/app/api/posts/[id]/comments/[commentId]/route.ts`
- Modify: `src/app/api/posts/[id]/reactions/route.ts`
- Modify: `src/app/api/posts/[id]/tags/route.ts`

**Interfaces:**
- Consumes: `requireUser` / `jsonError`(Task 7)
- Produces: 挙動不変(Task 3 の特性テストが引き続き全パスすることが完了条件)

**書き換えパターン(全ルート共通)。** 現在の形:

```typescript
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...本体
  if (error) {
    console.error("...", error);
    return NextResponse.json({ error: "Failed to ..." }, { status: 500 });
  }
}
```

書き換え後:

```typescript
import { requireUser, jsonError } from "@/lib/api/route-helpers";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  // ...本体(変更しない)
  if (error) {
    console.error("...", error);
    return jsonError("Failed to ...", 500);
  }
}
```

**厳守事項:**
- エラーメッセージ文字列・ステータスコード・成功レスポンスの形は1文字も変えない
- `console.error` の呼び出しは残す
- クエリ本体・バリデーションロジックは移動しない(このタスクはボイラープレート置換のみ)
- `user` を使わないハンドラでは `const { supabase } = auth;` だけ分割代入する(未使用変数lint回避)
- 認証チェックが `authError || !user` でなく `!user` だけのルートも `requireUser()` に統一してよい(モック上の挙動は同一。特性テストで確認)

- [ ] **Step 1:** 6ファイルを上記パターンで書き換える
- [ ] **Step 2: 検証**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: 全パス(特にTask 3の特性テストが1件も落ちないこと)

- [ ] **Step 3: コミット**

```bash
git add src/app/api/posts
git commit -m "refactor: posts系ルートを requireUser / jsonError に統一"
```

---

### Task 9: family系ルートをヘルパーで書き換え

**Files:**
- Modify: `src/app/api/children/route.ts`
- Modify: `src/app/api/children/[id]/route.ts`
- Modify: `src/app/api/family-members/route.ts`
- Modify: `src/app/api/family-members/me/route.ts`
- Modify: `src/app/api/invitations/route.ts`
- Modify: `src/app/api/invitations/[code]/route.ts`
- Modify: `src/app/api/profile/route.ts`

**Interfaces:**
- Consumes: `requireUser` / `jsonError`(Task 7)
- Produces: 挙動不変(Task 2・4 の特性テストが全パス)

Task 8 の「書き換えパターン」「厳守事項」とまったく同じ規則で書き換える。

- [ ] **Step 1:** 7ファイルを書き換える
- [ ] **Step 2:** Run: `npx tsc --noEmit && npm run lint && npm test` → 全パス
- [ ] **Step 3: コミット**

```bash
git add src/app/api/children src/app/api/family-members src/app/api/invitations src/app/api/profile
git commit -m "refactor: family系ルートを requireUser / jsonError に統一"
```

---

### Task 10: monthly・growth系ルートをヘルパーで書き換え

**Files:**
- Modify: `src/app/api/monthly/[year]/route.ts`
- Modify: `src/app/api/monthly/[year]/[month]/route.ts`
- Modify: `src/app/api/growth-records/route.ts`
- Modify: `src/app/api/growth-records/[id]/route.ts`
- Modify: `src/app/api/growth-milestones/route.ts`
- Modify: `src/app/api/growth-milestones/[id]/route.ts`
- Modify: `src/app/api/featured/[year]/[month]/route.ts`
- Modify: `src/app/api/years/route.ts`

**Interfaces:**
- Consumes: `requireUser` / `jsonError`(Task 7)
- Produces: 挙動不変(Task 5 の特性テストが全パス)

Task 8 の「書き換えパターン」「厳守事項」とまったく同じ規則で書き換える。

- [ ] **Step 1:** 8ファイルを書き換える
- [ ] **Step 2:** Run: `npx tsc --noEmit && npm run lint && npm test` → 全パス
- [ ] **Step 3: コミット**

```bash
git add src/app/api/monthly src/app/api/growth-records src/app/api/growth-milestones src/app/api/featured src/app/api/years
git commit -m "refactor: monthly・growth系ルートを requireUser / jsonError に統一"
```

---

### Task 11: admin・upload・ai系ルートをヘルパーで書き換え

**Files:**
- Modify: `src/app/api/admin/users/route.ts`
- Modify: `src/app/api/admin/users/[id]/route.ts`
- Modify: `src/app/api/upload/presign/route.ts`
- Modify: `src/app/api/ai/caption/route.ts`

**Interfaces:**
- Consumes: `requireUser` / `jsonError`(Task 7)
- Produces: 挙動不変(Task 6 の特性テストが全パス)

Task 8 の「書き換えパターン」「厳守事項」とまったく同じ規則で書き換える。admin系の `isSuperAdmin` チェック(403)や `createAdminClient` の使用箇所はそのまま残す(このタスクで共通化するのは認証チェックとエラーレスポンス生成のみ)。

- [ ] **Step 1:** 4ファイルを書き換える
- [ ] **Step 2:** Run: `npx tsc --noEmit && npm run lint && npm test` → 全パス
- [ ] **Step 3: コミット**

```bash
git add src/app/api/admin src/app/api/upload src/app/api/ai
git commit -m "refactor: admin・upload・ai系ルートを requireUser / jsonError に統一"
```

---

### Task 12: HomeGallery の分割

**Files:**
- Modify: `src/components/home/HomeGallery.tsx`(495行 → 200行以下を目標)
- Create: `src/components/home/useHomeGalleryData.ts`
- Create: `src/components/home/MonthTabs.tsx`
- Create: `src/components/home/GalleryStates.tsx`
- Create: `src/lib/home/gallery-cache.ts`
- Create: `src/lib/home/gallery-cache.test.ts`

**Interfaces:**
- Produces:
  - `useHomeGalleryData` — 現在HomeGallery内にある fetchAvailableMonths / fetchMonthlyData / fetchYearsData とその状態(photos, years, availableMonths, featuredImage, isLoading, error)を包むカスタムフック
  - `MonthTabs` — 現在の内部関数コンポーネント `MonthTabs`(402行目付近)をpropsそのままで別ファイル化
  - `GalleryStates` — 内部の `LoadingState` / `ErrorState` を別ファイル化
  - `gallery-cache.ts` — `getCacheKey(year, month, childId)` などキャッシュ関連の純粋関数

**分割の厳守事項(Task 13〜16 も共通):**
- 見た目・挙動・fetchタイミングを一切変えない。propsとstateの流れを変えるのは移動に必要な最小限のみ
- 抽出した純粋関数(`gallery-cache.ts`)にはユニットテストを書く。フックとUIコンポーネントのテストは不要(特性テストの範囲外。E2Eと目視で担保)
- 元ファイルからの単純な移動を基本とし、「ついでの改善」をしない
- 分割後に `npm run build` が通ること

- [ ] **Step 1:** `HomeGallery.tsx` を通読し、上記4ファイルへ分割する
- [ ] **Step 2:** `gallery-cache.test.ts` を書く(getCacheKeyのキー生成規則を固定)
- [ ] **Step 3:** Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` → 全パス
- [ ] **Step 4: コミット**

```bash
git add src/components/home src/lib/home
git commit -m "refactor: HomeGalleryをデータフック・サブコンポーネントに分割"
```

---

### Task 13: admin ページの分割

**Files:**
- Modify: `src/app/admin/page.tsx`(462行 → 150行以下を目標)
- Create: `src/components/admin/useAdminUsers.ts`
- Create: `src/components/admin/UserEditModal.tsx`
- Create: `src/components/admin/UserDeleteModal.tsx`
- Create: `src/components/admin/types.ts`

**Interfaces:**
- Produces:
  - `types.ts` — 現在page内にある `AdminUser` インターフェースを移動しエクスポート
  - `useAdminUsers` — ユーザー一覧取得・編集・削除のAPI呼び出しと状態(users, loading, error, 各操作のloading)を包むフック
  - `UserEditModal` / `UserDeleteModal` — 編集・削除モーダルUI

Task 12 の「分割の厳守事項」に従う。

- [ ] **Step 1:** `admin/page.tsx` を通読し、上記構成に分割する
- [ ] **Step 2:** Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` → 全パス
- [ ] **Step 3: コミット**

```bash
git add src/app/admin src/components/admin
git commit -m "refactor: adminページをフック・モーダルコンポーネントに分割"
```

---

### Task 14: UploadForm の分割

**Files:**
- Modify: `src/components/upload/UploadForm.tsx`(389行 → 200行以下を目標)
- Create: `src/components/upload/useUploadFlow.ts`
- Create: `src/components/upload/useCaptionGenerator.ts`
- Modify: `src/components/upload/index.ts`(エクスポート追加があれば)

**Interfaces:**
- Produces:
  - `useUploadFlow` — ファイル選択・プレビュー・presign取得→R2アップロード→post作成の一連のフローと進捗状態を包むフック
  - `useCaptionGenerator` — AIキャプション生成の呼び出しと状態(isGeneratingCaption, captionError)を包むフック

Task 12 の「分割の厳守事項」に従う。タグ選択(selectedTagMemberIds / TagModal連携)は既存のままUploadForm本体に残してよい(既に別コンポーネント化されているため)。

- [ ] **Step 1:** `UploadForm.tsx` を通読し、上記構成に分割する
- [ ] **Step 2:** Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` → 全パス
- [ ] **Step 3: コミット**

```bash
git add src/components/upload
git commit -m "refactor: UploadFormをアップロード・キャプション生成フックに分割"
```

---

### Task 15: timeline・growth系コンポーネントの分割

**Files:**
- Modify: `src/components/timeline/TimelineFeed.tsx`(257行)
- Modify: `src/components/timeline/CommentSection.tsx`(237行)
- Modify: `src/components/growth/GrowthChart.tsx`(263行)
- Create: `src/components/timeline/useTimelineFeed.ts`
- Create: `src/components/timeline/useComments.ts`
- Create: `src/lib/growth/chart-data.ts`
- Create: `src/lib/growth/chart-data.test.ts`

**Interfaces:**
- Produces:
  - `useTimelineFeed` — 投稿一覧のカーソルページネーション取得ロジックを包むフック
  - `useComments` — コメントの取得・投稿・削除ロジックを包むフック
  - `chart-data.ts` — GrowthChart内のデータ変換・目盛り計算などの純粋関数(recharts描画はコンポーネントに残す)

Task 12 の「分割の厳守事項」に従う。`chart-data.test.ts` で抽出した純粋関数の変換結果を固定する。各コンポーネントが250行を下回れば十分であり、過剰な分割はしない。

- [ ] **Step 1:** `TimelineFeed.tsx` → `useTimelineFeed.ts` 抽出
- [ ] **Step 2:** `CommentSection.tsx` → `useComments.ts` 抽出
- [ ] **Step 3:** `GrowthChart.tsx` → `chart-data.ts` 抽出 + テスト作成
- [ ] **Step 4:** Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` → 全パス
- [ ] **Step 5: コミット**

```bash
git add src/components/timeline src/components/growth src/lib/growth
git commit -m "refactor: timeline・growth系コンポーネントからロジックを抽出"
```

---

### Task 16: invite・onboarding ページの分割

**Files:**
- Modify: `src/app/invite/[code]/page.tsx`(268行)
- Modify: `src/app/onboarding/role/page.tsx`(244行)
- Create: `src/components/auth/useInviteAcceptance.ts`
- Create: `src/components/auth/RoleSelector.tsx`

**Interfaces:**
- Produces:
  - `useInviteAcceptance` — 招待コード検証・承諾のAPI呼び出しと状態遷移を包むフック
  - `RoleSelector` — 役割選択UI(選択肢表示と選択状態のみを持つ制御コンポーネント。`value` / `onChange` プロップ)

Task 12 の「分割の厳守事項」に従う。実装を読んだ結果、上記の抽出単位が実態と合わない場合は「データ取得と状態遷移をフックへ、繰り返しUIをコンポーネントへ」の原則で最も自然な単位に調整してよい(その場合は成果報告で構成を説明する)。

- [ ] **Step 1:** `invite/[code]/page.tsx` を分割する
- [ ] **Step 2:** `onboarding/role/page.tsx` を分割する
- [ ] **Step 3:** Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` → 全パス
- [ ] **Step 4: コミット**

```bash
git add src/app/invite src/app/onboarding src/components/auth
git commit -m "refactor: invite・onboardingページからロジックとUIを抽出"
```

---

### Task 17: 最終検証と仕上げ

**Files:**
- Verify: 全体
- Modify(必要なら): `.gitignore`

**Interfaces:**
- Consumes: これまでの全タスク
- Produces: リリース可能な `refactor/cleanup` ブランチと最終報告

- [ ] **Step 1: gitignore 整備**

`playwright-report/`・`test-results/`・`tsconfig.tsbuildinfo` が `.gitignore` に含まれているか確認し、なければ追記してコミットする。`test-image.png`(未追跡の手動テスト用画像)はユーザーの手元ファイルなので削除もコミットもしない。

- [ ] **Step 2: フルチェック**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: すべて成功

- [ ] **Step 3: E2E(環境が動く場合のみ)**

Run: `npx supabase status` でローカルSupabaseの起動を確認。起動していれば `npm run test:e2e` を実行。起動していなければスキップし、最終報告に「E2E未実施」と明記する。

- [ ] **Step 4: 最終レビューと報告**

`git log --oneline main..refactor/cleanup` と `git diff main --stat` で全変更を俯瞰し、以下を含む最終報告をまとめる:

- 追加した特性テストの件数と全テスト数
- 削減された重複(ルート書き換え前後の行数差)
- 分割したコンポーネントと新構成
- 特性テスト作成中に発見した既存バグのリスト(あれば)
- E2E実施有無

- [ ] **Step 5: コミット(残変更があれば)**

```bash
git add -A
git commit -m "chore: リファクタリング最終仕上げ(gitignore整備)"
```

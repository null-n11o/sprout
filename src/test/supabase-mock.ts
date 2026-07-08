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

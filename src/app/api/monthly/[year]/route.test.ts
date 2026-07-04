import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseMock } from "@/test/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

function setSupabase(mock: ReturnType<typeof createSupabaseMock>) {
  mockCreateClient.mockResolvedValue(mock as never);
}

function getRequest(url: string) {
  return new NextRequest(url);
}

function params(year: string) {
  return { params: Promise.resolve({ year }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/monthly/[year]", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET(
      getRequest("http://localhost/api/monthly/2024"),
      params("2024")
    );
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("yearが数値でなければ400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await GET(
      getRequest("http://localhost/api/monthly/abc"),
      params("abc")
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid year" });
  });

  it("yearが範囲外(2000未満)なら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await GET(
      getRequest("http://localhost/api/monthly/1999"),
      params("1999")
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid year" });
  });

  it("yearが範囲外(2100超)なら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await GET(
      getRequest("http://localhost/api/monthly/2101"),
      params("2101")
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid year" });
  });

  it("投稿取得に失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: null, error: { message: "db down" } } },
      })
    );

    const response = await GET(
      getRequest("http://localhost/api/monthly/2024"),
      params("2024")
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch posts" });
  });

  it("成功時は写真が存在する月の一覧を昇順・重複なしで返す", async () => {
    const posts = [
      { created_at: "2024-03-15T12:00:00.000Z" },
      { created_at: "2024-01-10T12:00:00.000Z" },
      { created_at: "2024-03-20T12:00:00.000Z" },
    ];
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: posts } },
      })
    );

    const response = await GET(
      getRequest("http://localhost/api/monthly/2024"),
      params("2024")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ availableMonths: [1, 3] });
  });

  it("child_idクエリパラメータ指定時も成功する", async () => {
    const posts = [{ created_at: "2024-05-15T12:00:00.000Z" }];
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: posts } },
      })
    );

    const response = await GET(
      getRequest("http://localhost/api/monthly/2024?child_id=c1"),
      params("2024")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ availableMonths: [5] });
  });
});

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

function getRequest(url = "http://localhost/api/years") {
  return new NextRequest(url);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/years", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET(getRequest());
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("投稿取得に失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: null, error: { message: "db down" } } },
      })
    );

    const response = await GET(getRequest());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch posts" });
  });

  it("投稿が0件ならyears:[]を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: [] } },
      })
    );

    const response = await GET(getRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ years: [] });
    expect(response.headers.get("Cache-Control")).toBe(
      "private, max-age=300, stale-while-revalidate=600"
    );
  });

  it("成功時は年ごとにグループ化し、リアクション最多のサムネイルと共に年降順で返す", async () => {
    const posts = [
      {
        id: "p1",
        media_url: "http://example.com/2024-a.jpg",
        created_at: "2024-06-15T12:00:00.000Z",
      },
      {
        id: "p2",
        media_url: "http://example.com/2023-a.jpg",
        created_at: "2023-06-15T12:00:00.000Z",
      },
      {
        id: "p3",
        media_url: "http://example.com/2024-b.jpg",
        created_at: "2024-07-15T12:00:00.000Z",
      },
    ];
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: posts },
          // from("reactions") 呼び出し順は yearMap の走査順(2024→2023)、
          // 各年内は元のposts配列の順(p1, p3, p2)
          reactions: [{ count: 5 }, { count: 2 }, { count: 1 }],
        },
      })
    );

    const response = await GET(getRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      years: [
        { year: 2024, thumbnailUrl: "http://example.com/2024-a.jpg", photoCount: 2 },
        { year: 2023, thumbnailUrl: "http://example.com/2023-a.jpg", photoCount: 1 },
      ],
    });
  });
});

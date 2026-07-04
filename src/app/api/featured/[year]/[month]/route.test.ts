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

function params(year: string, month: string) {
  return { params: Promise.resolve({ year, month }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/featured/[year]/[month]", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET(
      getRequest("http://localhost/api/featured/2024/3"),
      params("2024", "3")
    );
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("yearまたはmonthが不正なら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await GET(
      getRequest("http://localhost/api/featured/2024/13"),
      params("2024", "13")
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid year or month" });
  });

  it("投稿取得に失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: null, error: { message: "db down" } } },
      })
    );

    const response = await GET(
      getRequest("http://localhost/api/featured/2024/3"),
      params("2024", "3")
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch posts" });
  });

  it("対象月に投稿が無ければfeatured:nullを返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: [] } },
      })
    );

    const response = await GET(
      getRequest("http://localhost/api/featured/2024/3"),
      params("2024", "3")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ featured: null });
    expect(response.headers.get("Cache-Control")).toBe(
      "private, max-age=60, stale-while-revalidate=300"
    );
  });

  it("成功時はリアクション数が最多の投稿をfeaturedとして返す", async () => {
    const posts = [
      {
        id: "p1",
        media_url: "http://example.com/1.jpg",
        created_at: "2024-03-01T12:00:00.000Z",
        child: { id: "c1", name: "太郎" },
      },
      {
        id: "p2",
        media_url: "http://example.com/2.jpg",
        created_at: "2024-03-02T12:00:00.000Z",
        child: { id: "c2", name: "花子" },
      },
    ];
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: posts },
          reactions: [{ count: 3 }, { count: 5 }],
        },
      })
    );

    const response = await GET(
      getRequest("http://localhost/api/featured/2024/3"),
      params("2024", "3")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      featured: {
        id: "p2",
        mediaUrl: "http://example.com/2.jpg",
        childId: "c2",
        childName: "花子",
        createdAt: "2024-03-02T12:00:00.000Z",
        reactionCount: 5,
      },
    });
  });
});

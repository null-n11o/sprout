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

describe("GET /api/monthly/[year]/[month]", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET(
      getRequest("http://localhost/api/monthly/2024/3"),
      params("2024", "3")
    );
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("yearが数値でなければ400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await GET(
      getRequest("http://localhost/api/monthly/abc/3"),
      params("abc", "3")
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid year or month" });
  });

  it("monthが範囲外(13)なら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await GET(
      getRequest("http://localhost/api/monthly/2024/13"),
      params("2024", "13")
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid year or month" });
  });

  it("写真の取得に失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: null, error: { message: "db down" } } },
      })
    );

    const response = await GET(
      getRequest("http://localhost/api/monthly/2024/3"),
      params("2024", "3")
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch photos" });
  });

  it("成長記録の取得に失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: [] },
          growth_records: { data: null, error: { message: "db down" } },
        },
      })
    );

    const response = await GET(
      getRequest("http://localhost/api/monthly/2024/3"),
      params("2024", "3")
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch growth records" });
  });

  it("成長メモの取得に失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: [] },
          growth_records: { data: [] },
          growth_milestones: { data: null, error: { message: "db down" } },
        },
      })
    );

    const response = await GET(
      getRequest("http://localhost/api/monthly/2024/3"),
      params("2024", "3")
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch milestones" });
  });

  it("成功時は写真・成長記録・成長メモをまとめて返す", async () => {
    const photos = [
      {
        id: "p1",
        media_url: "http://example.com/1.jpg",
        media_type: "image",
        created_at: "2024-03-15T12:00:00.000Z",
        child: { id: "c1", name: "太郎" },
      },
    ];
    const growthRecords = [
      { height: 70, weight: 8, recorded_at: "2024-03-10" },
    ];
    const milestones = [{ id: "m1", content: "はじめて歩いた", child_id: "c1" }];
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: photos },
          growth_records: { data: growthRecords },
          growth_milestones: { data: milestones },
        },
      })
    );

    const response = await GET(
      getRequest("http://localhost/api/monthly/2024/3"),
      params("2024", "3")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      photos,
      growthRecord: growthRecords[0],
      milestones,
    });
    expect(response.headers.get("Cache-Control")).toBe(
      "private, max-age=60, stale-while-revalidate=300"
    );
  });

  it("成長記録が0件ならgrowthRecordはnullを返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: [] },
          growth_records: { data: [] },
          growth_milestones: { data: [] },
        },
      })
    );

    const response = await GET(
      getRequest("http://localhost/api/monthly/2024/3"),
      params("2024", "3")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ photos: [], growthRecord: null, milestones: [] });
  });
});

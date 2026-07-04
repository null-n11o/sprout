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

function getRequest(url = "http://localhost/api/growth-milestones") {
  return new NextRequest(url);
}

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/growth-milestones", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/growth-milestones", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET(getRequest());
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("DBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          growth_milestones: { data: null, error: { message: "db down" } },
        },
      })
    );

    const response = await GET(getRequest());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch milestones" });
  });

  it("成功時はmilestones一覧を返す", async () => {
    const milestones = [
      {
        id: "m1",
        content: "はじめて歩いた",
        child_id: "c1",
        recorded_at: "2024-03-01",
        created_at: "2024-03-15T00:00:00.000Z",
      },
    ];
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { growth_milestones: { data: milestones } },
      })
    );

    const response = await GET(getRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ milestones });
  });
});

describe("POST /api/growth-milestones", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await POST(
      postRequest({ child_id: "c1", content: "はじめて歩いた", recorded_at: "2024-03-01" })
    );

    expect(response.status).toBe(401);
  });

  it("必須項目が欠けていれば400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(postRequest({ content: "はじめて歩いた", recorded_at: "2024-03-01" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Missing required fields: child_id, content, recorded_at",
    });
  });

  it("contentが空文字列(トリム後)なら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(
      postRequest({ child_id: "c1", content: "   ", recorded_at: "2024-03-01" })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Content must be a non-empty string" });
  });

  it("作成に失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          growth_milestones: { data: null, error: { message: "constraint" } },
        },
      })
    );

    const response = await POST(
      postRequest({ child_id: "c1", content: "はじめて歩いた", recorded_at: "2024-03-01" })
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to create milestone" });
  });

  it("作成に成功したら201でmilestoneを返す", async () => {
    const milestone = { id: "m1", child_id: "c1", content: "はじめて歩いた", recorded_at: "2024-03-01" };
    const mock = createSupabaseMock({
      user: { id: "u1" },
      tables: { growth_milestones: { data: milestone } },
    });
    setSupabase(mock);

    const response = await POST(
      postRequest({ child_id: "c1", content: "はじめて歩いた", recorded_at: "2024-03-01" })
    );
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual({ milestone });
  });

  it("recorded_atがYYYY-MM形式ならYYYY-MM-01に正規化し、contentはトリムしてinsertする", async () => {
    const milestone = { id: "m1" };
    const mock = createSupabaseMock({
      user: { id: "u1" },
      tables: { growth_milestones: { data: milestone } },
    });
    setSupabase(mock);

    await POST(postRequest({ child_id: "c1", content: "  はじめて歩いた  ", recorded_at: "2024-03" }));

    const chain = mock.from.mock.results[0].value as { insert: ReturnType<typeof vi.fn> };
    expect(chain.insert).toHaveBeenCalledWith({
      child_id: "c1",
      content: "はじめて歩いた",
      recorded_at: "2024-03-01",
    });
  });
});

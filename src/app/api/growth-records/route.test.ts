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

function getRequest(url: string) {
  return new NextRequest(url);
}

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/growth-records", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/growth-records", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET(getRequest("http://localhost/api/growth-records"));
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("DBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          growth_records: { data: null, error: { message: "db down" } },
        },
      })
    );

    const response = await GET(getRequest("http://localhost/api/growth-records"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch growth records" });
  });

  it("成功時は成長記録一覧を返す", async () => {
    const records = [
      {
        id: "r1",
        height: 70,
        weight: 8,
        recorded_at: "2024-03-10",
        child: { id: "c1", name: "太郎", birth_date: "2023-01-01" },
      },
    ];
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { growth_records: { data: records } },
      })
    );

    const response = await GET(getRequest("http://localhost/api/growth-records"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ records });
  });
});

describe("POST /api/growth-records", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await POST(
      postRequest({ child_id: "c1", height: 70, weight: 8, recorded_at: "2024-03-10" })
    );

    expect(response.status).toBe(401);
  });

  it("必須項目が欠けていれば400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(postRequest({ height: 70, weight: 8, recorded_at: "2024-03-10" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Missing required fields: child_id, height, weight, recorded_at",
    });
  });

  it("heightが範囲外なら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(
      postRequest({ child_id: "c1", height: 999, weight: 8, recorded_at: "2024-03-10" })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Height must be between 30 and 200 cm" });
  });

  it("weightが範囲外なら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(
      postRequest({ child_id: "c1", height: 70, weight: 999, recorded_at: "2024-03-10" })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Weight must be between 1 and 100 kg" });
  });

  it("作成に失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          growth_records: { data: null, error: { message: "constraint" } },
        },
      })
    );

    const response = await POST(
      postRequest({ child_id: "c1", height: 70, weight: 8, recorded_at: "2024-03-10" })
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to create growth record" });
  });

  it("作成に成功したら201でrecordを返す", async () => {
    const record = { id: "r1", child_id: "c1", height: 70, weight: 8, recorded_at: "2024-03-10" };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { growth_records: { data: record } },
      })
    );

    const response = await POST(
      postRequest({ child_id: "c1", height: 70, weight: 8, recorded_at: "2024-03-10" })
    );
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual({ record });
  });
});

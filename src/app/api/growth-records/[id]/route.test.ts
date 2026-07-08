import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseMock } from "@/test/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { GET, PUT, DELETE } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

function setSupabase(mock: ReturnType<typeof createSupabaseMock>) {
  mockCreateClient.mockResolvedValue(mock as never);
}

function getRequest() {
  return new NextRequest("http://localhost/api/growth-records/r1");
}

function putRequest(body: unknown) {
  return new NextRequest("http://localhost/api/growth-records/r1", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function deleteRequest() {
  return new NextRequest("http://localhost/api/growth-records/r1", {
    method: "DELETE",
  });
}

function params() {
  return { params: Promise.resolve({ id: "r1" }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/growth-records/[id]", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET(getRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("レコードが存在しなければ404を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { growth_records: { data: null, error: { message: "not found" } } },
      })
    );

    const response = await GET(getRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "Growth record not found" });
  });

  it("成功時はrecordを返す", async () => {
    const record = {
      id: "r1",
      height: 70,
      weight: 8,
      recorded_at: "2024-03-10",
      child: { id: "c1", name: "太郎", birth_date: "2023-01-01" },
    };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { growth_records: { data: record } },
      })
    );

    const response = await GET(getRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ record });
  });
});

describe("PUT /api/growth-records/[id]", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await PUT(putRequest({ height: 70 }), params());

    expect(response.status).toBe(401);
  });

  it("heightが範囲外なら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await PUT(putRequest({ height: 999 }), params());
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Height must be between 30 and 200 cm" });
  });

  it("weightが範囲外なら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await PUT(putRequest({ weight: 999 }), params());
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Weight must be between 1 and 100 kg" });
  });

  it("更新項目が何もなければ400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await PUT(putRequest({}), params());
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "No fields to update" });
  });

  it("更新に失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { growth_records: { data: null, error: { message: "db down" } } },
      })
    );

    const response = await PUT(putRequest({ height: 70 }), params());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to update growth record" });
  });

  it("更新に成功したら200でrecordを返す", async () => {
    const record = { id: "r1", height: 75, weight: 9 };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { growth_records: { data: record } },
      })
    );

    const response = await PUT(putRequest({ height: 75, weight: 9 }), params());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ record });
  });
});

describe("DELETE /api/growth-records/[id]", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await DELETE(deleteRequest(), params());

    expect(response.status).toBe(401);
  });

  it("削除に失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { growth_records: { data: null, error: { message: "db down" } } },
      })
    );

    const response = await DELETE(deleteRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to delete growth record" });
  });

  it("削除に成功したら200でsuccess:trueを返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { growth_records: { data: null } },
      })
    );

    const response = await DELETE(deleteRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
  });
});

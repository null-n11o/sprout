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

function paramsFor(id: string) {
  return { params: Promise.resolve({ id }) };
}

function getRequest(id: string) {
  const request = new NextRequest(`http://localhost/api/children/${id}`);
  return GET(request, paramsFor(id));
}

function putRequest(id: string, body: unknown) {
  const request = new NextRequest(`http://localhost/api/children/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  return PUT(request, paramsFor(id));
}

function deleteRequest(id: string) {
  const request = new NextRequest(`http://localhost/api/children/${id}`, {
    method: "DELETE",
  });
  return DELETE(request, paramsFor(id));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/children/[id]", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await getRequest("c1");
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("子どもが見つからなければ404を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          children: { data: null, error: { code: "PGRST116" } },
        },
      })
    );

    const response = await getRequest("c1");
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "Child not found" });
  });

  it("DBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          children: { data: null, error: { code: "OTHER", message: "db down" } },
        },
      })
    );

    const response = await getRequest("c1");
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch child" });
  });

  it("成功すれば子ども情報を返す", async () => {
    const child = { id: "c1", name: "太郎", birth_date: "2023-01-01" };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { children: { data: child } },
      })
    );

    const response = await getRequest("c1");
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ child });
  });
});

describe("PUT /api/children/[id]", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await putRequest("c1", {
      name: "太郎",
      birth_date: "2023-01-01",
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("nameがなければ400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await putRequest("c1", { birth_date: "2023-01-01" });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Name is required" });
  });

  it("birth_dateがなければ400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await putRequest("c1", { name: "太郎" });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Birth date is required" });
  });

  it("子どもが見つからなければ404を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          children: { data: null, error: { code: "PGRST116" } },
        },
      })
    );

    const response = await putRequest("c1", {
      name: "太郎",
      birth_date: "2023-01-01",
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "Child not found" });
  });

  it("DBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          children: { data: null, error: { code: "OTHER", message: "db down" } },
        },
      })
    );

    const response = await putRequest("c1", {
      name: "太郎",
      birth_date: "2023-01-01",
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to update child" });
  });

  it("更新に成功すれば子ども情報を返す", async () => {
    const child = { id: "c1", name: "太郎", birth_date: "2023-01-01" };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { children: { data: child } },
      })
    );

    const response = await putRequest("c1", {
      name: "太郎",
      birth_date: "2023-01-01",
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ child });
  });
});

describe("DELETE /api/children/[id]", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await deleteRequest("c1");
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("紐づく投稿があれば400を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { count: 2 } },
      })
    );

    const response = await deleteRequest("c1");
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error:
        "Cannot delete child with existing posts. Please delete posts first.",
    });
  });

  it("紐づく成長記録があれば400を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { count: 0 },
          growth_records: { count: 3 },
        },
      })
    );

    const response = await deleteRequest("c1");
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error:
        "Cannot delete child with existing growth records. Please delete records first.",
    });
  });

  it("削除に失敗すれば500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { count: 0 },
          growth_records: { count: 0 },
          children: { data: null, error: { message: "delete failed" } },
        },
      })
    );

    const response = await deleteRequest("c1");
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to delete child" });
  });

  it("削除に成功すればsuccess: trueを返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { count: 0 },
          growth_records: { count: 0 },
          children: { data: null, error: null },
        },
      })
    );

    const response = await deleteRequest("c1");
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
  });
});

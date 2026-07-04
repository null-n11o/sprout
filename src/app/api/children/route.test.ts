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

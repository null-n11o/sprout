import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseMock } from "@/test/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { GET, PUT } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

function setSupabase(mock: ReturnType<typeof createSupabaseMock>) {
  mockCreateClient.mockResolvedValue(mock as never);
}

function putRequest(body: unknown) {
  return new NextRequest("http://localhost/api/profile", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/profile", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("認証済みならプロフィールを返す", async () => {
    const profile = { id: "u1", name: "花子", avatar_url: null };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { profiles: { data: profile } },
      })
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ profile });
  });

  it("DBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { profiles: { data: null, error: { message: "db down" } } },
      })
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch profile" });
  });
});

describe("PUT /api/profile", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await PUT(putRequest({ name: "花子" }));
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("nameが空文字なら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await PUT(putRequest({ name: "" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Name is required" });
  });

  it("nameが空白のみなら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await PUT(putRequest({ name: "   " }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Name is required" });
  });

  it("nameが文字列でなければ400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await PUT(putRequest({ name: 123 }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Name is required" });
  });

  it("更新に成功すればプロフィールを返す", async () => {
    const profile = { id: "u1", name: "花子", avatar_url: null };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { profiles: { data: profile } },
      })
    );

    const response = await PUT(putRequest({ name: "花子" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ profile });
  });

  it("DB更新エラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          profiles: { data: null, error: { message: "update failed" } },
        },
      })
    );

    const response = await PUT(putRequest({ name: "花子" }));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to update profile" });
  });
});

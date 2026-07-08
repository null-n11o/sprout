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

function getRequest() {
  return new NextRequest("http://localhost/api/posts/post-1/reactions");
}

function postRequest() {
  return new NextRequest("http://localhost/api/posts/post-1/reactions", {
    method: "POST",
  });
}

function params() {
  return { params: Promise.resolve({ id: "post-1" }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/posts/[id]/reactions", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET(getRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("いいね済みならhasReacted:trueとcountを返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          reactions: [{ data: { id: "r1" } }, { count: 5 }],
        },
      })
    );

    const response = await GET(getRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ hasReacted: true, count: 5 });
  });

  it("いいねしていなければhasReacted:falseを返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          reactions: [{ data: null }, { count: 3 }],
        },
      })
    );

    const response = await GET(getRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ hasReacted: false, count: 3 });
  });

  it("countがnullなら0を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          reactions: [{ data: null }, { count: null }],
        },
      })
    );

    const response = await GET(getRequest(), params());
    const json = await response.json();

    expect(json).toEqual({ hasReacted: false, count: 0 });
  });
});

describe("POST /api/posts/[id]/reactions", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await POST(postRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("既存のリアクションがある場合は削除しhasReacted:falseを返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          reactions: [{ data: { id: "r1" } }, { error: null }, { count: 2 }],
        },
      })
    );

    const response = await POST(postRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ hasReacted: false, count: 2 });
  });

  it("既存リアクションの削除がDBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          reactions: [{ data: { id: "r1" } }, { error: { message: "del fail" } }],
        },
      })
    );

    const response = await POST(postRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to remove reaction" });
  });

  it("既存のリアクションがなければ追加しhasReacted:trueを返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          reactions: [{ data: null }, { error: null }, { count: 1 }],
        },
      })
    );

    const response = await POST(postRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ hasReacted: true, count: 1 });
  });

  it("リアクションの追加がDBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          reactions: [{ data: null }, { error: { message: "ins fail" } }],
        },
      })
    );

    const response = await POST(postRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to add reaction" });
  });
});

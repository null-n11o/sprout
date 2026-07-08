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
  return new NextRequest("http://localhost/api/posts/post-1/comments");
}

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/posts/post-1/comments", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function params() {
  return { params: Promise.resolve({ id: "post-1" }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/posts/[id]/comments", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET(getRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("認証済みならコメント一覧を返す", async () => {
    const comments = [
      { id: "c1", post_id: "post-1", content: "かわいい", user: { id: "u1", name: "ママ", avatar_url: null } },
    ];
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { comments: { data: comments } },
      })
    );

    const response = await GET(getRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ comments });
  });

  it("DBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { comments: { data: null, error: { message: "db down" } } },
      })
    );

    const response = await GET(getRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch comments" });
  });
});

describe("POST /api/posts/[id]/comments", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await POST(postRequest({ content: "かわいい" }), params());

    expect(response.status).toBe(401);
  });

  it("contentがなければ400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(postRequest({}), params());
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Content is required" });
  });

  it("contentが文字列でなければ400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(postRequest({ content: 123 }), params());
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Content is required" });
  });

  it("contentが空白のみなら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(postRequest({ content: "   " }), params());
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Content cannot be empty" });
  });

  it("contentが501文字以上なら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(postRequest({ content: "あ".repeat(501) }), params());
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Content must be 500 characters or less" });
  });

  it("作成に成功したら201でcommentを返す", async () => {
    const comment = { id: "c1", post_id: "post-1", content: "かわいい", user: { id: "u1", name: "ママ", avatar_url: null } };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { comments: { data: comment } },
      })
    );

    const response = await POST(postRequest({ content: "かわいい" }), params());
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual({ comment });
  });

  it("insertが失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { comments: { data: null, error: { message: "constraint" } } },
      })
    );

    const response = await POST(postRequest({ content: "かわいい" }), params());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to create comment" });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseMock } from "@/test/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { DELETE } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

function setSupabase(mock: ReturnType<typeof createSupabaseMock>) {
  mockCreateClient.mockResolvedValue(mock as never);
}

function deleteRequest() {
  return new NextRequest("http://localhost/api/posts/post-1/comments/comment-1", {
    method: "DELETE",
  });
}

function params() {
  return { params: Promise.resolve({ id: "post-1", commentId: "comment-1" }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DELETE /api/posts/[id]/comments/[commentId]", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await DELETE(deleteRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("コメントが存在しなければ404を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { comments: { data: null } },
      })
    );

    const response = await DELETE(deleteRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "Comment not found" });
  });

  it("所有者でなければ403を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { comments: { data: { id: "comment-1", user_id: "other-user" } } },
      })
    );

    const response = await DELETE(deleteRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: "Forbidden" });
  });

  it("所有者なら削除に成功しsuccess:trueを返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          comments: [
            { data: { id: "comment-1", user_id: "u1" } },
            { data: null, error: null },
          ],
        },
      })
    );

    const response = await DELETE(deleteRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
  });

  it("削除がDBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          comments: [
            { data: { id: "comment-1", user_id: "u1" } },
            { data: null, error: { message: "db down" } },
          ],
        },
      })
    );

    const response = await DELETE(deleteRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to delete comment" });
  });
});

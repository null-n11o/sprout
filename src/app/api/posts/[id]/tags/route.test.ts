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

function getRequest() {
  return new NextRequest("http://localhost/api/posts/post-1/tags");
}

function putRequestRaw(rawBody: string) {
  return new NextRequest("http://localhost/api/posts/post-1/tags", {
    method: "PUT",
    body: rawBody,
    headers: { "Content-Type": "application/json" },
  });
}

function putRequest(body: unknown) {
  return putRequestRaw(JSON.stringify(body));
}

function params() {
  return { params: Promise.resolve({ id: "post-1" }) };
}

const UUID_1 = "11111111-1111-4111-8111-111111111111";
const UUID_2 = "22222222-2222-4222-8222-222222222222";

function makeTagRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "tag-1",
    member_id: UUID_1,
    created_at: "2024-01-01T00:00:00.000Z",
    family_members: {
      id: UUID_1,
      role: "mother",
      custom_role_name: null,
      profiles: { id: "profile-1", name: "ママ", avatar_url: null },
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/posts/[id]/tags", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET(getRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("投稿が見つからなければ404を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: null } },
      })
    );

    const response = await GET(getRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "投稿が見つかりません" });
  });

  it("タグ一覧を取得して返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: { id: "post-1" } },
          post_tags: { data: [makeTagRow()] },
        },
      })
    );

    const response = await GET(getRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      tags: [
        {
          id: UUID_1,
          role: "mother",
          customRoleName: null,
          profile: { id: "profile-1", name: "ママ", avatarUrl: null },
          taggedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    });
  });

  it("タグ取得がDBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: { id: "post-1" } },
          post_tags: { data: null, error: { message: "db down" } },
        },
      })
    );

    const response = await GET(getRequest(), params());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "タグの取得に失敗しました" });
  });
});

describe("PUT /api/posts/[id]/tags", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await PUT(putRequest({ memberIds: [] }), params());
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("リクエストボディが不正なJSONなら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await PUT(putRequestRaw("not-json"), params());
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid request body" });
  });

  it("memberIdsが配列でなければ400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await PUT(putRequest({}), params());
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "memberIdsは配列である必要があります" });
  });

  it("memberIdsに無効なUUIDが含まれれば400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await PUT(putRequest({ memberIds: ["not-a-uuid"] }), params());
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "無効なメンバーIDが含まれています" });
  });

  it("memberIdsに重複があれば400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await PUT(putRequest({ memberIds: [UUID_1, UUID_1] }), params());
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "重複するメンバーIDが含まれています" });
  });

  it("投稿が見つからなければ404を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: null } },
      })
    );

    const response = await PUT(putRequest({ memberIds: [] }), params());
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "投稿が見つかりません" });
  });

  it("投稿者でなければ403を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: { id: "post-1", user_id: "other-user" } } },
      })
    );

    const response = await PUT(putRequest({ memberIds: [] }), params());
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: "この投稿のタグを編集する権限がありません" });
  });

  it("メンバー存在確認がDBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: { id: "post-1", user_id: "u1" } },
          family_members: { data: null, error: { message: "db down" } },
        },
      })
    );

    const response = await PUT(putRequest({ memberIds: [UUID_1] }), params());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "メンバーの確認に失敗しました" });
  });

  it("指定されたメンバーが見つからなければ400を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: { id: "post-1", user_id: "u1" } },
          family_members: { data: [{ id: UUID_1 }] },
        },
      })
    );

    const response = await PUT(putRequest({ memberIds: [UUID_1, UUID_2] }), params());
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "指定されたメンバーが見つかりません" });
  });

  it("既存タグの削除がDBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: { id: "post-1", user_id: "u1" } },
          post_tags: { data: null, error: { message: "delete fail" } },
        },
      })
    );

    const response = await PUT(putRequest({ memberIds: [] }), params());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "タグの削除に失敗しました" });
  });

  it("新しいタグの挿入がDBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: { id: "post-1", user_id: "u1" } },
          family_members: { data: [{ id: UUID_1 }] },
          post_tags: [
            { data: null, error: null },
            { data: null, error: { message: "insert fail" } },
          ],
        },
      })
    );

    const response = await PUT(putRequest({ memberIds: [UUID_1] }), params());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "タグの設定に失敗しました" });
  });

  it("更新後のタグ取得がDBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: { id: "post-1", user_id: "u1" } },
          post_tags: [
            { data: null, error: null },
            { data: null, error: { message: "fetch fail" } },
          ],
        },
      })
    );

    const response = await PUT(putRequest({ memberIds: [] }), params());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "タグの取得に失敗しました" });
  });

  it("memberIdsが空配列なら既存タグを削除しタグなしで成功を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: { id: "post-1", user_id: "u1" } },
          post_tags: [
            { data: null, error: null },
            { data: [], error: null },
          ],
        },
      })
    );

    const response = await PUT(putRequest({ memberIds: [] }), params());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ tags: [] });
  });

  it("memberIdsが指定されていればタグを設定し直して返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          posts: { data: { id: "post-1", user_id: "u1" } },
          family_members: { data: [{ id: UUID_1 }] },
          post_tags: [
            { data: null, error: null },
            { data: null, error: null },
            { data: [makeTagRow()], error: null },
          ],
        },
      })
    );

    const response = await PUT(putRequest({ memberIds: [UUID_1] }), params());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      tags: [
        {
          id: UUID_1,
          role: "mother",
          customRoleName: null,
          profile: { id: "profile-1", name: "ママ", avatarUrl: null },
          taggedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    });
  });
});

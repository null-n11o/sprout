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

function getRequest(url = "http://localhost/api/posts") {
  return new NextRequest(url);
}

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/posts", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    child_id: "child-1",
    user_id: "u1",
    media_url: "https://example.com/a.jpg",
    media_type: "image",
    caption: null,
    created_at: "2024-01-05T00:00:00.000Z",
    child: { id: "child-1", name: "太郎", birth_date: "2023-01-01", avatar_url: null },
    user: { id: "u1", name: "ママ", avatar_url: null },
    reactions: [{ count: 3 }],
    comments: [{ count: 2 }],
    user_reaction: [{ id: "r1", user_id: "u1" }],
    post_tags: [
      {
        id: "tag-1",
        member_id: "member-1",
        created_at: "2024-01-01T00:00:00.000Z",
        family_members: {
          id: "member-1",
          role: "mother",
          custom_role_name: null,
          profiles: { id: "profile-1", name: "ママ", avatar_url: null },
        },
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/posts", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET(getRequest());
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("認証済みなら投稿一覧を変換して返す(reaction_count/comment_count/has_reacted/tags)", async () => {
    const post = makePost();
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: [post] } },
      })
    );

    const response = await GET(getRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.posts).toHaveLength(1);
    const transformed = json.posts[0];
    expect(transformed.reaction_count).toBe(3);
    expect(transformed.comment_count).toBe(2);
    expect(transformed.has_reacted).toBe(true);
    expect(transformed.tags).toEqual([
      {
        id: "member-1",
        role: "mother",
        customRoleName: null,
        profile: { id: "profile-1", name: "ママ", avatarUrl: null },
      },
    ]);
    expect(transformed.reactions).toBeUndefined();
    expect(transformed.comments).toBeUndefined();
    expect(transformed.user_reaction).toBeUndefined();
    expect(transformed.post_tags).toBeUndefined();
    expect(json.nextCursor).toBeNull();
  });

  it("has_reactedはuser_reactionに自分のuser_idが含まれない場合falseになる", async () => {
    const post = makePost({ user_reaction: [{ id: "r1", user_id: "other-user" }] });
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: [post] } },
      })
    );

    const response = await GET(getRequest());
    const json = await response.json();

    expect(json.posts[0].has_reacted).toBe(false);
  });

  it("post_tagsがnullの場合tagsは空配列になる", async () => {
    const post = makePost({ post_tags: null });
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: [post] } },
      })
    );

    const response = await GET(getRequest());
    const json = await response.json();

    expect(json.posts[0].tags).toEqual([]);
  });

  it("投稿数がPOSTS_PER_PAGE(10)ちょうどならnextCursorは最後の投稿のcreated_atになる", async () => {
    const posts = Array.from({ length: 10 }, (_, i) =>
      makePost({ id: `post-${i}`, created_at: `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00.000Z` })
    );
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: posts } },
      })
    );

    const response = await GET(getRequest());
    const json = await response.json();

    expect(json.nextCursor).toBe("2024-01-10T00:00:00.000Z");
  });

  it("投稿数がPOSTS_PER_PAGE未満ならnextCursorはnull", async () => {
    const posts = [makePost()];
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: posts } },
      })
    );

    const response = await GET(getRequest());
    const json = await response.json();

    expect(json.nextCursor).toBeNull();
  });

  it("cursorとchild_idクエリパラメータを指定しても成功する", async () => {
    const post = makePost();
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: [post] } },
      })
    );

    const response = await GET(
      getRequest("http://localhost/api/posts?cursor=2024-01-01T00:00:00.000Z&child_id=child-1")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.posts).toHaveLength(1);
  });

  it("DBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: null, error: { message: "db down" } } },
      })
    );

    const response = await GET(getRequest());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch posts" });
  });
});

describe("POST /api/posts", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await POST(
      postRequest({ child_id: "c1", media_url: "url", media_type: "image" })
    );

    expect(response.status).toBe(401);
  });

  it("必須フィールドが不足していれば400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(postRequest({ child_id: "c1" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Missing required fields: child_id, media_url, media_type",
    });
  });

  it("media_typeが不正なら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(
      postRequest({ child_id: "c1", media_url: "url", media_type: "audio" })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Invalid media_type. Must be 'image' or 'video'",
    });
  });

  it("作成に成功したら201でpostを返す", async () => {
    const post = { id: "post-1", child_id: "c1", media_url: "url", media_type: "image" };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: post } },
      })
    );

    const response = await POST(
      postRequest({ child_id: "c1", media_url: "url", media_type: "image" })
    );
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual({ post });
  });

  it("insertが失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { posts: { data: null, error: { message: "constraint" } } },
      })
    );

    const response = await POST(
      postRequest({ child_id: "c1", media_url: "url", media_type: "image" })
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to create post" });
  });
});

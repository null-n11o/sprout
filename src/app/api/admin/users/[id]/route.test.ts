import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, type SupabaseMockOptions } from "@/test/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GET, PATCH, DELETE } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);
const mockCreateAdminClient = vi.mocked(createAdminClient);

const SUPER_ADMIN_EMAIL = "nakano.kentaro7@gmail.com";

function setSupabase(mock: ReturnType<typeof createSupabaseMock>) {
  mockCreateClient.mockResolvedValue(mock as never);
}

function setAdminClient(overrides: {
  getUserById?: unknown;
  deleteUser?: unknown;
  tables?: SupabaseMockOptions["tables"];
}) {
  const base = createSupabaseMock({ user: { id: "admin-1" }, tables: overrides.tables });
  const adminClient = {
    ...base,
    auth: {
      ...base.auth,
      admin: {
        getUserById: vi.fn(async () => overrides.getUserById),
        deleteUser: vi.fn(async () => overrides.deleteUser),
      },
    },
  };
  mockCreateAdminClient.mockReturnValue(adminClient as never);
  return adminClient;
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

function patchRequest(body: unknown) {
  return new Request("http://localhost/api/admin/users/u1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function deleteRequest() {
  return new Request("http://localhost/api/admin/users/u1", { method: "DELETE" });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/users/[id]", () => {
  it("未認証なら403を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET(new Request("http://localhost/api/admin/users/u1"), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: "Forbidden" });
  });

  it("スーパー管理者でなければ403を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1", email: "not-admin@example.com" } }));

    const response = await GET(new Request("http://localhost/api/admin/users/u1"), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: "Forbidden" });
  });

  it("対象ユーザーが存在しなければ404を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    setAdminClient({ getUserById: { data: { user: null }, error: null } });

    const response = await GET(new Request("http://localhost/api/admin/users/u1"), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "User not found" });
  });

  it("getUserByIdがエラーを返しても404を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    setAdminClient({ getUserById: { data: { user: null }, error: { message: "not found" } } });

    const response = await GET(new Request("http://localhost/api/admin/users/u1"), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "User not found" });
  });

  it("成功時はユーザー詳細を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));

    const targetUser = {
      id: "u1",
      email: "user1@example.com",
      user_metadata: { name: "メタ太郎", avatar_url: "https://example.com/meta.png" },
      app_metadata: { provider: "google" },
      created_at: "2024-01-01T00:00:00.000Z",
      last_sign_in_at: "2024-02-01T00:00:00.000Z",
    };
    const profile = {
      name: "太郎",
      avatar_url: "https://example.com/avatar.png",
      role: "admin",
      birth_date: "1990-01-01",
      gender: "male",
    };

    setAdminClient({
      getUserById: { data: { user: targetUser }, error: null },
      tables: { profiles: { data: profile } },
    });

    const response = await GET(new Request("http://localhost/api/admin/users/u1"), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      id: "u1",
      email: "user1@example.com",
      name: "太郎",
      avatarUrl: "https://example.com/avatar.png",
      role: "admin",
      birthDate: "1990-01-01",
      gender: "male",
      createdAt: "2024-01-01T00:00:00.000Z",
      lastSignInAt: "2024-02-01T00:00:00.000Z",
      provider: "google",
    });
  });

  it("createAdminClientが例外を投げたら500を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    mockCreateAdminClient.mockImplementation(() => {
      throw new Error("boom");
    });

    const response = await GET(new Request("http://localhost/api/admin/users/u1"), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Internal server error" });
  });
});

describe("PATCH /api/admin/users/[id]", () => {
  it("未認証なら403を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await PATCH(patchRequest({ name: "新太郎" }), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: "Forbidden" });
  });

  it("スーパー管理者でなければ403を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1", email: "not-admin@example.com" } }));

    const response = await PATCH(patchRequest({ name: "新太郎" }), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: "Forbidden" });
  });

  it("更新に成功したらsuccess:trueを返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    setAdminClient({ tables: { profiles: { data: null } } });

    const response = await PATCH(
      patchRequest({ name: "新太郎", role: "admin", birthDate: "1990-01-01", gender: "male" }),
      params("u1")
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
  });

  it("更新対象フィールドが無い場合もsuccess:trueを返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    setAdminClient({});

    const response = await PATCH(patchRequest({}), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
  });

  it("プロファイル更新が失敗したら500を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    setAdminClient({
      tables: { profiles: { data: null, error: { message: "update failed" } } },
    });

    const response = await PATCH(patchRequest({ name: "新太郎" }), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to update user" });
  });

  it("bodyのJSONパースに失敗したら500を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    setAdminClient({});

    const invalidRequest = new Request("http://localhost/api/admin/users/u1", {
      method: "PATCH",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(invalidRequest, params("u1"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Internal server error" });
  });
});

describe("DELETE /api/admin/users/[id]", () => {
  it("未認証なら403を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await DELETE(deleteRequest(), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: "Forbidden" });
  });

  it("スーパー管理者でなければ403を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1", email: "not-admin@example.com" } }));

    const response = await DELETE(deleteRequest(), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: "Forbidden" });
  });

  it("自分自身を削除しようとすると400を返す", async () => {
    setSupabase(
      createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } })
    );

    const response = await DELETE(deleteRequest(), params("admin-1"));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Cannot delete yourself" });
  });

  it("削除に成功したらsuccess:trueを返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    setAdminClient({ deleteUser: { error: null } });

    const response = await DELETE(deleteRequest(), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
  });

  it("削除が失敗したら500を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    setAdminClient({ deleteUser: { error: { message: "delete failed" } } });

    const response = await DELETE(deleteRequest(), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to delete user" });
  });

  it("createAdminClientが例外を投げたら500を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    mockCreateAdminClient.mockImplementation(() => {
      throw new Error("boom");
    });

    const response = await DELETE(deleteRequest(), params("u1"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Internal server error" });
  });
});

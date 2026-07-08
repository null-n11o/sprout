import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSupabaseMock, type SupabaseMockOptions } from "@/test/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GET } from "./route";

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
  listUsers?: unknown;
  tables?: SupabaseMockOptions["tables"];
}) {
  const base = createSupabaseMock({ user: { id: "admin-1" }, tables: overrides.tables });
  const adminClient = {
    ...base,
    auth: {
      ...base.auth,
      admin: {
        listUsers: vi.fn(async () => overrides.listUsers),
      },
    },
  };
  mockCreateAdminClient.mockReturnValue(adminClient as never);
  return adminClient;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/admin/users", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("スーパー管理者でなければ403を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1", email: "not-admin@example.com" } }));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: "Forbidden" });
  });

  it("SUPABASE_SERVICE_ROLE_KEYが未設定なら500を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Server configuration error: Missing service role key",
    });
  });

  it("スーパー管理者なら結合済みユーザー一覧を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    const authUser = {
      id: "u1",
      email: "user1@example.com",
      user_metadata: { name: "メタ太郎", avatar_url: "https://example.com/meta.png" },
      app_metadata: { provider: "google" },
      created_at: "2024-01-01T00:00:00.000Z",
      last_sign_in_at: "2024-02-01T00:00:00.000Z",
    };
    const profile = {
      id: "u1",
      name: "太郎",
      avatar_url: "https://example.com/avatar.png",
      role: "admin",
      birth_date: "1990-01-01",
      gender: "male",
    };

    setAdminClient({
      listUsers: { data: { users: [authUser] }, error: null },
      tables: { profiles: { data: [profile] } },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      users: [
        {
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
        },
      ],
      total: 1,
    });
  });

  it("プロファイルが存在しない場合はauth_userのメタ情報とデフォルト値を使う", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    const authUser = {
      id: "u2",
      email: "user2@example.com",
      user_metadata: {},
      app_metadata: {},
      created_at: "2024-01-01T00:00:00.000Z",
      last_sign_in_at: null,
    };

    setAdminClient({
      listUsers: { data: { users: [authUser] }, error: null },
      tables: { profiles: { data: [] } },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      users: [
        {
          id: "u2",
          email: "user2@example.com",
          name: "Unknown",
          avatarUrl: undefined,
          role: "editor",
          birthDate: undefined,
          gender: undefined,
          createdAt: "2024-01-01T00:00:00.000Z",
          lastSignInAt: null,
          provider: "email",
        },
      ],
      total: 1,
    });
  });

  it("listUsersが失敗したら500を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    setAdminClient({
      listUsers: { data: { users: [] }, error: { message: "auth down" } },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch users" });
  });

  it("createAdminClientが例外を投げたら500を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "admin-1", email: SUPER_ADMIN_EMAIL } }));
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    mockCreateAdminClient.mockImplementation(() => {
      throw new Error("boom");
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Internal server error",
      details: "boom",
    });
  });
});

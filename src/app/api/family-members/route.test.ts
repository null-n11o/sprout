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
  return new NextRequest("http://localhost/api/family-members", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function postRawRequest(rawBody: string) {
  return new NextRequest("http://localhost/api/family-members", {
    method: "POST",
    body: rawBody,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/family-members", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("認証済みなら家族メンバー一覧を返す", async () => {
    const membersRaw = [
      {
        id: "fm1",
        user_id: "u1",
        role: "mother",
        custom_role_name: null,
        role_confirmed: true,
        joined_at: "2024-01-01T00:00:00.000Z",
        profiles: { name: "花子", avatar_url: null },
      },
    ];
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { family_members: { data: membersRaw } },
      })
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      members: [
        {
          id: "fm1",
          userId: "u1",
          role: "mother",
          customRoleName: null,
          roleConfirmed: true,
          joinedAt: "2024-01-01T00:00:00.000Z",
          profile: { name: "花子", avatarUrl: null },
        },
      ],
    });
  });

  it("DBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_members: { data: null, error: { message: "db down" } },
        },
      })
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch family members" });
  });
});

describe("POST /api/family-members", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await POST(postRequest({ role: "mother" }));
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("不正なリクエストボディなら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(postRawRequest("not-json"));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid request body" });
  });

  it("roleが不正なら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(postRequest({ role: "unknown_role" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "無効な役割が指定されました" });
  });

  it("既に家族メンバーとして登録されていれば409を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_members: { data: { id: "existing" } },
        },
      })
    );

    const response = await POST(postRequest({ role: "mother" }));
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json).toEqual({ error: "既に家族メンバーとして登録されています" });
  });

  it("招待コードが見つからなければ400を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_members: { data: null },
          family_invitations: { data: null },
        },
      })
    );

    const response = await POST(
      postRequest({ role: "mother", invitationCode: "ABCDEFGH" })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "招待コードが見つかりません" });
  });

  it("招待が無効化されていれば400を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_members: { data: null },
          family_invitations: {
            data: {
              id: "inv1",
              code: "ABCDEFGH",
              created_by: "creator1",
              expires_at: "2099-01-01T00:00:00.000Z",
              used_count: 0,
              max_uses: 5,
              is_active: false,
            },
          },
        },
      })
    );

    const response = await POST(
      postRequest({ role: "mother", invitationCode: "ABCDEFGH" })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "招待コードが見つかりません" });
  });

  it("招待の有効期限が切れていれば410を返す", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-04T00:00:00.000Z"));
    try {
      setSupabase(
        createSupabaseMock({
          user: { id: "u1" },
          tables: {
            family_members: { data: null },
            family_invitations: {
              data: {
                id: "inv1",
                code: "ABCDEFGH",
                created_by: "creator1",
                expires_at: "2026-07-01T00:00:00.000Z",
                used_count: 0,
                max_uses: 5,
                is_active: true,
              },
            },
          },
        })
      );

      const response = await POST(
        postRequest({ role: "mother", invitationCode: "ABCDEFGH" })
      );
      const json = await response.json();

      expect(response.status).toBe(410);
      expect(json).toEqual({ error: "招待コードの有効期限が切れています" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("招待の使用回数が上限に達していれば400を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_members: { data: null },
          family_invitations: {
            data: {
              id: "inv1",
              code: "ABCDEFGH",
              created_by: "creator1",
              expires_at: "2099-01-01T00:00:00.000Z",
              used_count: 5,
              max_uses: 5,
              is_active: true,
            },
          },
        },
      })
    );

    const response = await POST(
      postRequest({ role: "mother", invitationCode: "ABCDEFGH" })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "招待コードは既に使用されています" });
  });

  it("招待コードの使用回数更新に失敗すれば500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_members: { data: null },
          family_invitations: [
            {
              data: {
                id: "inv1",
                code: "ABCDEFGH",
                created_by: "creator1",
                expires_at: "2099-01-01T00:00:00.000Z",
                used_count: 0,
                max_uses: 5,
                is_active: true,
              },
            },
            { data: null, error: { message: "update failed" } },
          ],
        },
      })
    );

    const response = await POST(
      postRequest({ role: "mother", invitationCode: "ABCDEFGH" })
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "招待コードの更新に失敗しました" });
  });

  it("家族メンバーの登録に失敗すれば500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_members: [
            { data: null },
            { data: null, error: { message: "insert failed" } },
          ],
        },
      })
    );

    const response = await POST(postRequest({ role: "mother" }));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "家族メンバーの登録に失敗しました" });
  });

  it("招待コードなしで登録に成功すれば201でmemberを返す", async () => {
    const insertedMember = {
      id: "fm1",
      user_id: "u1",
      role: "mother",
      custom_role_name: null,
      role_confirmed: true,
      joined_at: "2024-01-01T00:00:00.000Z",
      profiles: { name: "花子", avatar_url: null },
    };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_members: [{ data: null }, { data: insertedMember }],
        },
      })
    );

    const response = await POST(postRequest({ role: "mother" }));
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual({
      member: {
        id: "fm1",
        userId: "u1",
        role: "mother",
        customRoleName: null,
        roleConfirmed: true,
        joinedAt: "2024-01-01T00:00:00.000Z",
        profile: { name: "花子", avatarUrl: null },
      },
    });
  });

  it("招待コードありで登録に成功すれば201でmemberを返す", async () => {
    const insertedMember = {
      id: "fm2",
      user_id: "u1",
      role: "father",
      custom_role_name: null,
      role_confirmed: true,
      joined_at: "2024-01-01T00:00:00.000Z",
      profiles: { name: "太郎", avatar_url: null },
    };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_members: [{ data: null }, { data: insertedMember }],
          family_invitations: [
            {
              data: {
                id: "inv1",
                code: "ABCDEFGH",
                created_by: "creator1",
                expires_at: "2099-01-01T00:00:00.000Z",
                used_count: 0,
                max_uses: 5,
                is_active: true,
              },
            },
            { data: { used_count: 1 } },
          ],
        },
      })
    );

    const response = await POST(
      postRequest({ role: "father", invitationCode: "ABCDEFGH" })
    );
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.member.role).toBe("father");
  });

  it("role='other'の場合customRoleNameがinsertペイロードに渡される", async () => {
    const insertedMember = {
      id: "fm3",
      user_id: "u1",
      role: "other",
      custom_role_name: "おばあちゃん",
      role_confirmed: true,
      joined_at: "2024-01-01T00:00:00.000Z",
      profiles: { name: "花子", avatar_url: null },
    };
    const mock = createSupabaseMock({
      user: { id: "u1" },
      tables: {
        family_members: [{ data: null }, { data: insertedMember }],
      },
    });
    setSupabase(mock);

    const response = await POST(
      postRequest({ role: "other", customRoleName: "おばあちゃん" })
    );
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.member.customRoleName).toBe("おばあちゃん");

    const insertChain = mock.from.mock.results[1].value as {
      insert: ReturnType<typeof vi.fn>;
    };
    expect(insertChain.insert).toHaveBeenCalledWith({
      user_id: "u1",
      role: "other",
      custom_role_name: "おばあちゃん",
      role_confirmed: true,
    });
  });

  it("role!=='other'の場合customRoleNameが渡されてもcustom_role_nameはnullになる", async () => {
    const insertedMember = {
      id: "fm4",
      user_id: "u1",
      role: "mother",
      custom_role_name: null,
      role_confirmed: true,
      joined_at: "2024-01-01T00:00:00.000Z",
      profiles: { name: "花子", avatar_url: null },
    };
    const mock = createSupabaseMock({
      user: { id: "u1" },
      tables: {
        family_members: [{ data: null }, { data: insertedMember }],
      },
    });
    setSupabase(mock);

    await POST(postRequest({ role: "mother", customRoleName: "無視される" }));

    const insertChain = mock.from.mock.results[1].value as {
      insert: ReturnType<typeof vi.fn>;
    };
    expect(insertChain.insert).toHaveBeenCalledWith({
      user_id: "u1",
      role: "mother",
      custom_role_name: null,
      role_confirmed: true,
    });
  });
});

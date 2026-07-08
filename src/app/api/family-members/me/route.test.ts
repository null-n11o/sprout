import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseMock } from "@/test/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { PUT } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

function setSupabase(mock: ReturnType<typeof createSupabaseMock>) {
  mockCreateClient.mockResolvedValue(mock as never);
}

function putRequest(body: unknown) {
  return new NextRequest("http://localhost/api/family-members/me", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function putRawRequest(rawBody: string) {
  return new NextRequest("http://localhost/api/family-members/me", {
    method: "PUT",
    body: rawBody,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PUT /api/family-members/me", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await PUT(putRequest({ role: "mother" }));
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("不正なリクエストボディなら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await PUT(putRawRequest("not-json"));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid request body" });
  });

  it("roleが不正なら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await PUT(putRequest({ role: "unknown_role" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "無効な役割が指定されました" });
  });

  it("家族メンバーの取得に失敗すれば500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_members: {
            data: null,
            error: { message: "fetch failed" },
          },
        },
      })
    );

    const response = await PUT(putRequest({ role: "mother" }));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to fetch family member" });
  });

  it("家族メンバーとして登録されていなければ404を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_members: { data: null },
        },
      })
    );

    const response = await PUT(putRequest({ role: "mother" }));
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "家族メンバーとして登録されていません" });
  });

  it("役割の更新に失敗すれば500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_members: [
            { data: { id: "fm1" } },
            { data: null, error: { message: "update failed" } },
          ],
        },
      })
    );

    const response = await PUT(putRequest({ role: "mother" }));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "役割の更新に失敗しました" });
  });

  it("更新に成功すればmemberを返す", async () => {
    const updatedMember = {
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
          family_members: [{ data: { id: "fm1" } }, { data: updatedMember }],
        },
      })
    );

    const response = await PUT(putRequest({ role: "mother" }));
    const json = await response.json();

    expect(response.status).toBe(200);
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
});

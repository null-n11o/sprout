import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

function setSupabase(mock: ReturnType<typeof createSupabaseMock>) {
  mockCreateClient.mockResolvedValue(mock as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  delete process.env.VERCEL_URL;
});

describe("POST /api/invitations", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("コード生成に成功すればcode, link, expiresAtを返す", async () => {
    const invitation = {
      code: "ABCDEFGH",
      created_by: "u1",
      expires_at: "2026-07-11T00:00:00.000Z",
    };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_invitations: [{ data: null }, { data: invitation }],
        },
      })
    );

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      code: "ABCDEFGH",
      link: "http://localhost:3000/invite/ABCDEFGH",
      expiresAt: "2026-07-11T00:00:00.000Z",
    });
  });

  it("コード重複時はリトライして成功する", async () => {
    const invitation = {
      code: "ZZZZZZZZ",
      created_by: "u1",
      expires_at: "2026-07-11T00:00:00.000Z",
    };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_invitations: [
            { data: { code: "AAAAAAAA" } },
            { data: { code: "BBBBBBBB" } },
            { data: null },
            { data: invitation },
          ],
        },
      })
    );

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.code).toBe("ZZZZZZZZ");
  });

  it("リトライ上限に達すれば500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_invitations: { data: { code: "EXISTS" } },
        },
      })
    );

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to generate invitation code" });
  });

  it("招待の作成に失敗すれば500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_invitations: [
            { data: null },
            { data: null, error: { message: "insert failed" } },
          ],
        },
      })
    );

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to create invitation" });
  });

  it("NEXT_PUBLIC_APP_URLが設定されていればそれをベースURLとして使う", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    const invitation = {
      code: "ABCDEFGH",
      created_by: "u1",
      expires_at: "2026-07-11T00:00:00.000Z",
    };
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          family_invitations: [{ data: null }, { data: invitation }],
        },
      })
    );

    const response = await POST();
    const json = await response.json();

    expect(json.link).toBe("https://example.com/invite/ABCDEFGH");
  });
});

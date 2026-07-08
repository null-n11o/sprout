import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseMock } from "@/test/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

function setSupabase(mock: ReturnType<typeof createSupabaseMock>) {
  mockCreateClient.mockResolvedValue(mock as never);
}

function getRequest(code: string) {
  const request = new NextRequest(
    `http://localhost/api/invitations/${code}`
  );
  return GET(request, { params: Promise.resolve({ code }) });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/invitations/[code]", () => {
  it("コードのフォーマットが不正なら404を返す", async () => {
    setSupabase(createSupabaseMock({}));

    const response = await getRequest("short");
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({
      valid: false,
      error: { type: "NOT_FOUND", message: "無効な招待コードです" },
    });
  });

  it("DBエラーなら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        tables: {
          family_invitations: {
            data: null,
            error: { message: "db down" },
          },
        },
      })
    );

    const response = await getRequest("ABCDEFGH");
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      valid: false,
      error: { type: "NOT_FOUND", message: "エラーが発生しました" },
    });
  });

  it("招待が見つからなければ404を返す", async () => {
    setSupabase(
      createSupabaseMock({
        tables: { family_invitations: { data: null } },
      })
    );

    const response = await getRequest("ABCDEFGH");
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({
      valid: false,
      error: { type: "NOT_FOUND", message: "招待コードが見つかりません" },
    });
  });

  it("招待の有効期限が切れていれば410を返す", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-04T00:00:00.000Z"));
    try {
      setSupabase(
        createSupabaseMock({
          tables: {
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

      const response = await getRequest("ABCDEFGH");
      const json = await response.json();

      expect(response.status).toBe(410);
      expect(json).toEqual({
        valid: false,
        error: {
          type: "EXPIRED",
          message: "招待コードの有効期限が切れています",
        },
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("招待が無効化されていれば404を返す", async () => {
    setSupabase(
      createSupabaseMock({
        tables: {
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

    const response = await getRequest("ABCDEFGH");
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({
      valid: false,
      error: { type: "NOT_FOUND", message: "招待コードが見つかりません" },
    });
  });

  it("使用回数が上限に達していれば404を返す", async () => {
    setSupabase(
      createSupabaseMock({
        tables: {
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

    const response = await getRequest("ABCDEFGH");
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({
      valid: false,
      error: {
        type: "MAX_USES_REACHED",
        message: "招待コードは既に使用されています",
      },
    });
  });

  it("有効な招待コードなら200でvalid: trueを返す", async () => {
    setSupabase(
      createSupabaseMock({
        tables: {
          family_invitations: {
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
        },
      })
    );

    const response = await getRequest("ABCDEFGH");
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      valid: true,
      invitation: {
        code: "ABCDEFGH",
        expiresAt: "2099-01-01T00:00:00.000Z",
      },
    });
  });
});

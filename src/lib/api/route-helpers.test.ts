import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { jsonError, requireUser } from "./route-helpers";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("jsonError", () => {
  it("指定したメッセージとステータスのJSONレスポンスを返す", async () => {
    const response = jsonError("Not found", 404);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "Not found" });
  });
});

describe("requireUser", () => {
  it("未認証ならresponseに401を返す", async () => {
    mockCreateClient.mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );

    const result = await requireUser();

    expect(result.user).toBeNull();
    expect(result.response).not.toBeNull();
    expect(result.response!.status).toBe(401);
    expect(await result.response!.json()).toEqual({ error: "Unauthorized" });
  });

  it("認証済みならuserとsupabaseを返しresponseはnull", async () => {
    const mock = createSupabaseMock({ user: { id: "u1", email: "a@b.c" } });
    mockCreateClient.mockResolvedValue(mock as never);

    const result = await requireUser();

    expect(result.response).toBeNull();
    expect(result.user).toEqual({ id: "u1", email: "a@b.c" });
    expect(result.supabase).toBe(mock);
  });
});

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
  return new NextRequest("http://localhost/api/growth-milestones/id", {
    method: "DELETE",
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

const VALID_UUID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DELETE /api/growth-milestones/[id]", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await DELETE(deleteRequest(), params(VALID_UUID));
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("idがUUID形式でなければ400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await DELETE(deleteRequest(), params("not-a-uuid"));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid milestone ID" });
  });

  it("対象が存在しなければ404を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          growth_milestones: { data: null, error: { message: "not found" } },
        },
      })
    );

    const response = await DELETE(deleteRequest(), params(VALID_UUID));
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "Milestone not found" });
  });

  it("削除に失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          growth_milestones: [
            { data: { id: VALID_UUID } },
            { data: null, error: { message: "db down" } },
          ],
        },
      })
    );

    const response = await DELETE(deleteRequest(), params(VALID_UUID));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to delete milestone" });
  });

  it("削除に成功したら200でsuccess:trueを返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: {
          growth_milestones: [{ data: { id: VALID_UUID } }, { data: null }],
        },
      })
    );

    const response = await DELETE(deleteRequest(), params(VALID_UUID));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
  });
});

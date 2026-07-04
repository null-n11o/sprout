import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { getPresignedUploadUrl } from "@/lib/r2";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/r2", () => ({
  getPresignedUploadUrl: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);
const mockGetPresignedUploadUrl = vi.mocked(getPresignedUploadUrl);

function setSupabase(mock: ReturnType<typeof createSupabaseMock>) {
  mockCreateClient.mockResolvedValue(mock as never);
}

function postRequest(body: unknown) {
  return new Request("http://localhost/api/upload/presign", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/upload/presign", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await POST(
      postRequest({ childId: "c1", fileName: "a.png", contentType: "image/png" })
    );
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("必須フィールドが欠けていれば400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(postRequest({ childId: "c1" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Missing required fields: childId, fileName, contentType",
    });
  });

  it("許可されていないcontentTypeなら400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(
      postRequest({ childId: "c1", fileName: "a.txt", contentType: "text/plain" })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error:
        "Invalid content type. Allowed: image/jpeg, image/png, image/gif, image/webp, video/mp4, video/quicktime",
    });
  });

  it("対象の子どもが存在しなければ404を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { children: { data: null } },
      })
    );

    const response = await POST(
      postRequest({ childId: "c1", fileName: "a.png", contentType: "image/png" })
    );
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "Child not found" });
  });

  it("子ども確認クエリがエラーでも404を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { children: { data: null, error: { message: "db error" } } },
      })
    );

    const response = await POST(
      postRequest({ childId: "c1", fileName: "a.png", contentType: "image/png" })
    );
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "Child not found" });
  });

  it("成功時はgetPresignedUploadUrlの結果をそのまま返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { children: { data: { id: "c1" } } },
      })
    );

    const expiresAt = new Date("2024-01-01T00:15:00.000Z");
    mockGetPresignedUploadUrl.mockResolvedValue({
      uploadUrl: "https://r2.example.com/presigned",
      publicUrl: "https://public.example.com/children/c1/2024/01/123.png",
      key: "children/c1/2024/01/123.png",
      expiresAt,
    });

    const response = await POST(
      postRequest({ childId: "c1", fileName: "a.png", contentType: "image/png" })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      uploadUrl: "https://r2.example.com/presigned",
      publicUrl: "https://public.example.com/children/c1/2024/01/123.png",
      key: "children/c1/2024/01/123.png",
      expiresAt: expiresAt.toISOString(),
    });
    expect(mockGetPresignedUploadUrl).toHaveBeenCalledWith({
      childId: "c1",
      fileName: "a.png",
      contentType: "image/png",
    });
  });

  it("getPresignedUploadUrlが失敗したら500を返す", async () => {
    setSupabase(
      createSupabaseMock({
        user: { id: "u1" },
        tables: { children: { data: { id: "c1" } } },
      })
    );
    mockGetPresignedUploadUrl.mockRejectedValue(new Error("r2 down"));

    const response = await POST(
      postRequest({ childId: "c1", fileName: "a.png", contentType: "image/png" })
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to generate upload URL" });
  });

  it("bodyのJSONパースに失敗したら500を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const invalidRequest = new Request("http://localhost/api/upload/presign", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(invalidRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Failed to generate upload URL" });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseMock } from "@/test/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { generateCaption } from "@/lib/gemini";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/gemini", () => ({
  generateCaption: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);
const mockGenerateCaption = vi.mocked(generateCaption);

function setSupabase(mock: ReturnType<typeof createSupabaseMock>) {
  mockCreateClient.mockResolvedValue(mock as never);
}

function requestWithImage() {
  const formData = new FormData();
  formData.append("image", new File(["dummy"], "test.png", { type: "image/png" }));
  return new NextRequest("http://localhost/api/ai/caption", {
    method: "POST",
    body: formData,
  });
}

function requestWithoutImage() {
  const formData = new FormData();
  return new NextRequest("http://localhost/api/ai/caption", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/ai/caption", () => {
  it("未認証なら401を返す", async () => {
    setSupabase(createSupabaseMock({ user: null }));

    const response = await POST(requestWithImage());
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("認証エラーがあれば401を返す", async () => {
    const mock = createSupabaseMock({ user: { id: "u1" } });
    mock.auth.getUser = vi.fn(async () => ({
      data: { user: null },
      error: { message: "auth error" },
    }));
    setSupabase(mock);

    const response = await POST(requestWithImage());
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("画像が無ければ400を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));

    const response = await POST(requestWithoutImage());
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Image is required" });
  });

  it("成功時はキャプションを返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));
    mockGenerateCaption.mockResolvedValue("温かい家族の時間です。");

    const response = await POST(requestWithImage());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ caption: "温かい家族の時間です。" });
  });

  it("429やquotaを含むエラーならレート制限エラーを返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));
    mockGenerateCaption.mockRejectedValue(new Error("429 quota exceeded"));

    const response = await POST(requestWithImage());
    const json = await response.json();

    expect(response.status).toBe(429);
    expect(json).toEqual({
      error: "API利用制限に達しました。しばらく待ってから再度お試しください。",
      code: "RATE_LIMIT",
    });
  });

  it("APIキー未設定エラーなら503を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));
    mockGenerateCaption.mockRejectedValue(new Error("API key not valid"));

    const response = await POST(requestWithImage());
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json).toEqual({
      error: "AI機能が設定されていません。",
      code: "API_NOT_CONFIGURED",
    });
  });

  it("モデル利用不可エラーなら503を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));
    mockGenerateCaption.mockRejectedValue(new Error("model not found"));

    const response = await POST(requestWithImage());
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json).toEqual({
      error: "AIモデルが利用できません。",
      code: "MODEL_NOT_AVAILABLE",
    });
  });

  it("その他のエラーなら500を返す", async () => {
    setSupabase(createSupabaseMock({ user: { id: "u1" } }));
    mockGenerateCaption.mockRejectedValue(new Error("unexpected failure"));

    const response = await POST(requestWithImage());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "キャプションの生成に失敗しました。",
      code: "GENERATION_FAILED",
    });
  });
});

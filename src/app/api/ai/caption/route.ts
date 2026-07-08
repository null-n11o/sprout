import { NextRequest, NextResponse } from "next/server";
import { generateCaption } from "@/lib/gemini";
import { requireUser, jsonError } from "@/lib/api/route-helpers";

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const formData = await request.formData();
    const image = formData.get("image") as File | null;

    if (!image) {
      return jsonError("Image is required", 400);
    }

    // ファイルをBase64に変換
    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${image.type};base64,${base64}`;

    // Gemini でキャプション生成
    const caption = await generateCaption(dataUrl);

    return NextResponse.json({ caption });
  } catch (error) {
    console.error("Caption generation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // レート制限エラー
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      return NextResponse.json(
        {
          error: "API利用制限に達しました。しばらく待ってから再度お試しください。",
          code: "RATE_LIMIT",
        },
        { status: 429 }
      );
    }

    // APIキー未設定
    if (errorMessage.includes("API key not valid") || errorMessage.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        {
          error: "AI機能が設定されていません。",
          code: "API_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    // モデルが見つからない
    if (errorMessage.includes("not found") || errorMessage.includes("not supported")) {
      return NextResponse.json(
        {
          error: "AIモデルが利用できません。",
          code: "MODEL_NOT_AVAILABLE",
        },
        { status: 503 }
      );
    }

    // その他のエラー
    return NextResponse.json(
      {
        error: "キャプションの生成に失敗しました。",
        code: "GENERATION_FAILED",
      },
      { status: 500 }
    );
  }
}

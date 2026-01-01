import { getGeminiClient } from "./client";

const CAPTION_PROMPT = `あなたは家族の成長記録アプリのキャプション生成AIです。
この画像を見て、温かみのある日本語でキャプションを生成してください。

ガイドライン:
- 子供の成長や日常の様子を優しく表現する
- 2〜3文程度の短いキャプション
- 絵文字は使用しない
- 親しみやすく、家族の思い出として残したくなる表現

画像を解析して、キャプションのみを出力してください。`;

export async function generateCaption(imageData: string): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Base64 からプレフィックスを除去
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data,
      },
    },
    CAPTION_PROMPT,
  ]);

  const response = result.response;
  return response.text().trim();
}

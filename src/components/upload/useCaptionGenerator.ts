import { useState } from "react";

type UseCaptionGeneratorOptions = {
  onCaption: (caption: string) => void;
};

export function useCaptionGenerator({ onCaption }: UseCaptionGeneratorOptions) {
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [captionError, setCaptionError] = useState<string | null>(null);

  const generateCaption = async (file: File) => {
    setIsGeneratingCaption(true);
    setCaptionError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ai/caption", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onCaption(data.caption);
      } else {
        setCaptionError(data.error || "キャプションの生成に失敗しました");
      }
    } catch (error) {
      console.error("Caption generation failed:", error);
      setCaptionError("ネットワークエラーが発生しました");
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const clearCaptionError = () => setCaptionError(null);

  return {
    isGeneratingCaption,
    captionError,
    generateCaption,
    clearCaptionError,
  };
}

"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, X, Loader2, Sparkles, AlertCircle } from "lucide-react";

type Child = {
  id: string;
  name: string;
};

type UploadFormProps = {
  children: Child[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function UploadForm({ children, onSuccess, onCancel }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>(
    children[0]?.id || ""
  );
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaptionError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerateCaption = async () => {
    if (!selectedFile) return;

    setIsGeneratingCaption(true);
    setCaptionError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/ai/caption", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setCaption(data.caption);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedChildId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Presigned URL を取得
      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedChildId,
          fileName: selectedFile.name,
          contentType: selectedFile.type,
        }),
      });

      if (!presignResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, publicUrl } = await presignResponse.json();
      setUploadProgress(20);

      // 2. R2 にダイレクトアップロード
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }
      setUploadProgress(70);

      // 3. 投稿を作成
      const mediaType = selectedFile.type.startsWith("video/")
        ? "video"
        : "image";

      const postResponse = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: selectedChildId,
          media_url: publicUrl,
          media_type: mediaType,
          caption: caption || null,
        }),
      });

      if (!postResponse.ok) {
        throw new Error("Failed to create post");
      }
      setUploadProgress(100);

      onSuccess?.();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  const isVideo = selectedFile?.type.startsWith("video/");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ファイル選択 */}
      {!preview ? (
        <label className="block aspect-square bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Camera className="w-12 h-12 text-gray-400" />
            <span className="text-gray-500 text-sm">
              写真または動画を選択
            </span>
          </div>
        </label>
      ) : (
        <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">
          {isVideo ? (
            <video
              src={preview}
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <Image
              src={preview}
              alt="プレビュー"
              fill
              className="object-cover"
            />
          )}
          <button
            type="button"
            onClick={handleRemoveFile}
            className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 子供選択 */}
      <div className="flex gap-2">
        {children.map((child) => {
          const isSelected = selectedChildId === child.id;
          const colorClass =
            child.name === "カイリ"
              ? isSelected
                ? "bg-kairi-500 text-white"
                : "bg-kairi-100 text-kairi-600"
              : isSelected
                ? "bg-mare-500 text-white"
                : "bg-mare-100 text-mare-600";

          return (
            <button
              key={child.id}
              type="button"
              onClick={() => setSelectedChildId(child.id)}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${colorClass}`}
            >
              {child.name}
            </button>
          );
        })}
      </div>

      {/* キャプション */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            キャプション
          </label>
          {preview && !isVideo && (
            <button
              type="button"
              onClick={handleGenerateCaption}
              disabled={isGeneratingCaption}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50"
            >
              {isGeneratingCaption ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              AI で生成
            </button>
          )}
        </div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="この瞬間を言葉で残しましょう..."
          className="w-full px-4 py-3 bg-gray-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
          rows={3}
        />
        {captionError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{captionError}</span>
          </div>
        )}
      </div>

      {/* 進捗バー */}
      {isUploading && (
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500">
            アップロード中... {uploadProgress}%
          </p>
        </div>
      )}

      {/* ボタン */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isUploading}
          className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={!selectedFile || !selectedChildId || isUploading}
          className="flex-1 py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              投稿中...
            </>
          ) : (
            "投稿する"
          )}
        </button>
      </div>
    </form>
  );
}

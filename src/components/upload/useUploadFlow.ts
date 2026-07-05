import { useRef, useState, type ChangeEvent } from "react";

type UseUploadFlowOptions = {
  onSuccess?: () => void;
};

type SubmitParams = {
  childId: string;
  caption: string;
  tagMemberIds: string[];
};

export function useUploadFlow({ onSuccess }: UseUploadFlowOptions) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submit = async ({ childId, caption, tagMemberIds }: SubmitParams) => {
    if (!selectedFile || !childId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Presigned URL を取得
      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
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
          child_id: childId,
          media_url: publicUrl,
          media_type: mediaType,
          caption: caption || null,
        }),
      });

      if (!postResponse.ok) {
        throw new Error("Failed to create post");
      }

      const postData = await postResponse.json();
      setUploadProgress(90);

      // 4. タグを設定（選択されている場合）
      if (tagMemberIds.length > 0 && postData.post?.id) {
        const tagResponse = await fetch(`/api/posts/${postData.post.id}/tags`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberIds: tagMemberIds,
          }),
        });

        if (!tagResponse.ok) {
          console.error("Failed to set tags, but post was created");
        }
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

  return {
    selectedFile,
    preview,
    isUploading,
    uploadProgress,
    fileInputRef,
    handleFileSelect,
    removeFile,
    submit,
  };
}

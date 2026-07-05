"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, X, Loader2, Sparkles, AlertCircle, UserPlus } from "lucide-react";
import { TagSelectorModal } from "./TagSelectorModal";
import { useUploadFlow } from "./useUploadFlow";
import { useCaptionGenerator } from "./useCaptionGenerator";

type Child = {
  id: string;
  name: string;
};

type UploadFormProps = {
  childList: Child[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function UploadForm({ childList, onSuccess, onCancel }: UploadFormProps) {
  const [selectedChildId, setSelectedChildId] = useState<string>(
    childList[0]?.id || ""
  );
  const [caption, setCaption] = useState("");
  const [selectedTagMemberIds, setSelectedTagMemberIds] = useState<string[]>([]);
  const [taggedMemberNames, setTaggedMemberNames] = useState<string[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  const {
    selectedFile,
    preview,
    isUploading,
    uploadProgress,
    fileInputRef,
    handleFileSelect,
    removeFile,
    submit,
  } = useUploadFlow({ onSuccess });

  const {
    isGeneratingCaption,
    captionError,
    generateCaption,
    clearCaptionError,
  } = useCaptionGenerator({ onCaption: setCaption });

  const handleRemoveFile = () => {
    removeFile();
    clearCaptionError();
  };

  // タグ選択が確定されたときにメンバー名を取得
  const handleTagConfirm = async (memberIds: string[]) => {
    setSelectedTagMemberIds(memberIds);

    if (memberIds.length === 0) {
      setTaggedMemberNames([]);
      return;
    }

    // メンバー名を取得
    try {
      const response = await fetch("/api/family-members");
      if (response.ok) {
        const data = await response.json();
        const names = memberIds
          .map((id: string) => {
            const member = data.members.find((m: { id: string; profile: { name: string } }) => m.id === id);
            return member?.profile?.name;
          })
          .filter(Boolean) as string[];
        setTaggedMemberNames(names);
      }
    } catch (error) {
      console.error("Failed to fetch member names:", error);
    }
  };

  const handleGenerateCaption = async () => {
    if (!selectedFile) return;
    await generateCaption(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit({
      childId: selectedChildId,
      caption,
      tagMemberIds: selectedTagMemberIds,
    });
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
        {childList.map((child) => {
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

      {/* タグ付け */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          写っている人をタグ付け
        </label>
        <button
          type="button"
          onClick={() => setIsTagModalOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          data-testid="tag-selector-button"
        >
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">
              {taggedMemberNames.length > 0
                ? taggedMemberNames.join(", ")
                : "家族メンバーを選択"}
            </span>
          </div>
          {selectedTagMemberIds.length > 0 && (
            <span className="text-sm text-mare-600 font-medium">
              {selectedTagMemberIds.length}人選択中
            </span>
          )}
        </button>
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

      {/* タグ選択モーダル */}
      <TagSelectorModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        selectedMemberIds={selectedTagMemberIds}
        onConfirm={handleTagConfirm}
      />
    </form>
  );
}

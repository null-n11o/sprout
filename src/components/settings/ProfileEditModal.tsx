"use client";

import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { useToast } from "@/components/ui";
import { Loader2 } from "lucide-react";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentEmail: string;
  onUpdate: () => void;
}

export function ProfileEditModal({
  isOpen,
  onClose,
  currentName,
  currentEmail,
  onUpdate,
}: ProfileEditModalProps) {
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("名前を入力してください", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      showToast("プロフィールを更新しました", "success");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Profile update error:", error);
      showToast("プロフィールの更新に失敗しました", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="アカウント情報">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            value={currentEmail}
            disabled
            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            メールアドレスは変更できません
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            名前
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名前を入力"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mare-300 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-mare-400 text-white rounded-xl font-medium hover:bg-mare-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            保存
          </button>
        </div>
      </form>
    </Modal>
  );
}

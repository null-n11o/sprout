"use client";

import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { useToast } from "@/components/ui";
import { Loader2 } from "lucide-react";
import { Child } from "@/types/database";

interface ChildEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child | null;
  onUpdate: () => void;
}

export function ChildEditModal({
  isOpen,
  onClose,
  child,
  onUpdate,
}: ChildEditModalProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const isEditing = !!child;

  useEffect(() => {
    if (isOpen) {
      if (child) {
        setName(child.name);
        setBirthDate(child.birth_date);
        setGender(child.gender || "");
      } else {
        setName("");
        setBirthDate("");
        setGender("");
      }
    }
  }, [isOpen, child]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("名前を入力してください", "error");
      return;
    }

    if (!birthDate) {
      showToast("生年月日を入力してください", "error");
      return;
    }

    setIsLoading(true);
    try {
      const url = isEditing ? `/api/children/${child.id}` : "/api/children";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          birth_date: birthDate,
          gender: gender || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save child");
      }

      showToast(
        isEditing ? "子供の情報を更新しました" : "子供を追加しました",
        "success"
      );
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Child save error:", error);
      showToast(
        isEditing ? "更新に失敗しました" : "追加に失敗しました",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "子供の編集" : "子供の追加"}
    >
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名前を入力"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mare-300 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            生年月日 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mare-300 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            性別
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setGender("male")}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                gender === "male"
                  ? "bg-kairi-400 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              男の子
            </button>
            <button
              type="button"
              onClick={() => setGender("female")}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                gender === "female"
                  ? "bg-mare-400 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              女の子
            </button>
          </div>
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
            {isEditing ? "保存" : "追加"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

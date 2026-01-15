"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "./Modal";
import { ChildEditModal } from "./ChildEditModal";
import { useToast } from "@/components/ui";
import { Plus, Edit2, Trash2, Loader2, Baby, AlertTriangle } from "lucide-react";
import { Child } from "@/types/database";

interface ChildManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const today = new Date();
  const ageMonths =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth());

  if (ageMonths < 24) {
    return `${ageMonths}ヶ月`;
  } else {
    const years = Math.floor(ageMonths / 12);
    const months = ageMonths % 12;
    return months > 0 ? `${years}歳${months}ヶ月` : `${years}歳`;
  }
}

export function ChildManagement({ isOpen, onClose }: ChildManagementProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editChild, setEditChild] = useState<Child | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteChild, setDeleteChild] = useState<Child | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const fetchChildren = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/children");
      if (!response.ok) throw new Error("Failed to fetch children");
      const data = await response.json();
      setChildren(data.children || []);
    } catch (error) {
      console.error("Fetch children error:", error);
      showToast("子供の情報を取得できませんでした", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) {
      fetchChildren();
    }
  }, [isOpen, fetchChildren]);

  const handleAddChild = () => {
    setEditChild(null);
    setIsEditModalOpen(true);
  };

  const handleEditChild = (child: Child) => {
    setEditChild(child);
    setIsEditModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteChild) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/children/${deleteChild.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete child");
      }

      showToast("子供を削除しました", "success");
      setDeleteChild(null);
      fetchChildren();
    } catch (error) {
      console.error("Delete child error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "削除に失敗しました";
      showToast(message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="子供の管理">
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : children.length === 0 ? (
            <div className="text-center py-8">
              <Baby className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">まだ子供が登録されていません</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      child.gender === "female"
                        ? "bg-mare-100 text-mare-500"
                        : "bg-kairi-100 text-kairi-500"
                    }`}
                  >
                    <Baby className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">
                      {child.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(child.birth_date)} ({calculateAge(child.birth_date)})
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditChild(child)}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => setDeleteChild(child)}
                      className="p-2 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAddChild}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-mare-400 text-white rounded-xl font-medium hover:bg-mare-500 transition-colors"
          >
            <Plus className="w-5 h-5" />
            子供を追加
          </button>
        </div>
      </Modal>

      <ChildEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        child={editChild}
        onUpdate={fetchChildren}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteChild}
        onClose={() => setDeleteChild(null)}
        title="削除の確認"
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="font-medium text-gray-800">
                {deleteChild?.name}を削除しますか？
              </p>
              <p className="text-sm text-gray-500">
                この操作は取り消せません
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setDeleteChild(null)}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              削除
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

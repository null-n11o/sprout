"use client";

import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { useToast } from "@/components/ui";
import { Loader2, Check } from "lucide-react";
import {
  FAMILY_ROLES,
  FAMILY_ROLE_LABELS,
  type FamilyRole,
} from "@/lib/api/family-members";

interface RoleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: FamilyRole;
  currentCustomRoleName: string | null;
  onUpdate: () => void;
}

export function RoleEditModal({
  isOpen,
  onClose,
  currentRole,
  currentCustomRoleName,
  onUpdate,
}: RoleEditModalProps) {
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<FamilyRole>(currentRole);
  const [customRoleName, setCustomRoleName] = useState(currentCustomRoleName || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(currentRole);
      setCustomRoleName(currentCustomRoleName || "");
    }
  }, [isOpen, currentRole, currentCustomRoleName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRole === "other" && !customRoleName.trim()) {
      showToast("役割名を入力してください", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/family-members/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          customRoleName: selectedRole === "other" ? customRoleName.trim() : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "役割の更新に失敗しました");
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Role update error:", error);
      showToast(
        error instanceof Error ? error.message : "役割の更新に失敗しました",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="役割を変更">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <p className="text-sm text-gray-600">
          家族内での役割を選択してください
        </p>

        <div className="grid grid-cols-2 gap-2">
          {FAMILY_ROLES.map((role) => {
            const isSelected = selectedRole === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`p-3 rounded-xl border-2 text-left transition-colors ${
                  isSelected
                    ? "border-mare-400 bg-mare-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                data-testid={`role-option-${role}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${isSelected ? "text-mare-600" : "text-gray-700"}`}>
                    {FAMILY_ROLE_LABELS[role]}
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-mare-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom role name input (only for "other") */}
        {selectedRole === "other" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              役割名を入力
            </label>
            <input
              type="text"
              value={customRoleName}
              onChange={(e) => setCustomRoleName(e.target.value)}
              placeholder="例: いとこ、親戚"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mare-300 focus:border-transparent"
              data-testid="custom-role-input"
            />
          </div>
        )}

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

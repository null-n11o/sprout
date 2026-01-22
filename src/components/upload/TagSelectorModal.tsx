"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/settings/Modal";
import { Loader2, User, Check } from "lucide-react";
import {
  getRoleDisplayName,
  type FamilyRole,
} from "@/lib/api/family-members";

interface TagSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMemberIds: string[];
  onConfirm: (memberIds: string[]) => void;
}

interface FamilyMemberWithProfile {
  id: string;
  userId: string;
  role: FamilyRole;
  customRoleName: string | null;
  roleConfirmed: boolean;
  joinedAt: string;
  profile: {
    name: string;
    avatarUrl: string | null;
  };
}

export function TagSelectorModal({
  isOpen,
  onClose,
  selectedMemberIds,
  onConfirm,
}: TagSelectorModalProps) {
  const [members, setMembers] = useState<FamilyMemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedMemberIds);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/family-members");

      if (!response.ok) {
        throw new Error("家族メンバーの取得に失敗しました");
      }

      const data = await response.json();
      setMembers(data.members);
    } catch {
      setError("家族メンバーの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      setLocalSelectedIds(selectedMemberIds);
    }
  }, [isOpen, fetchMembers, selectedMemberIds]);

  const handleToggle = (memberId: string) => {
    setLocalSelectedIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleConfirm = () => {
    onConfirm(localSelectedIds);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="タグ付けする人を選択">
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
            <button
              onClick={fetchMembers}
              className="ml-2 underline hover:no-underline"
            >
              再試行
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>家族メンバーがいません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const isSelected = localSelectedIds.includes(member.id);
              const displayRole = getRoleDisplayName(
                member.role,
                member.customRoleName
              );

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleToggle(member.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    isSelected
                      ? "bg-mare-100 ring-2 ring-mare-400"
                      : "bg-cream-50 hover:bg-cream-100"
                  }`}
                  data-testid={`tag-member-${member.id}`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "bg-mare-500 text-white"
                        : "border-2 border-gray-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {member.profile.avatarUrl ? (
                      <img
                        src={member.profile.avatarUrl}
                        alt={member.profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Name and Role */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-gray-800 truncate">
                      {member.profile.name}
                    </p>
                    <p className="text-sm text-gray-500">{displayRole}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Confirm button */}
        {!isLoading && !error && members.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-900 transition-colors"
            >
              {localSelectedIds.length > 0
                ? `${localSelectedIds.length}人を選択`
                : "選択を解除"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

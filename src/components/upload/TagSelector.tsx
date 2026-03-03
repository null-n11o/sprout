"use client";

import { useState, useEffect } from "react";
import { Users, Check, Loader2, X } from "lucide-react";
import { FAMILY_ROLE_LABELS } from "@/lib/api/family-members";
import type { FamilyRole } from "@/lib/api/family-members";

type FamilyMember = {
  id: string;
  role: string;
  customRoleName: string | null;
  profile: {
    name: string;
    avatarUrl: string | null;
  };
};

type TagSelectorProps = {
  selectedMemberIds: string[];
  onChange: (memberIds: string[]) => void;
};

function getRoleLabel(role: string, customRoleName: string | null): string {
  if (role === "other" && customRoleName) return customRoleName;
  return FAMILY_ROLE_LABELS[role as FamilyRole] ?? role;
}

export function TagSelector({ selectedMemberIds, onChange }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetch("/api/family-members")
      .then((r) => r.json())
      .then((data) => {
        const list: FamilyMember[] = (data.members ?? []).map(
          (m: {
            id: string;
            role: string;
            customRoleName: string | null;
            profile: { name: string; avatarUrl: string | null };
          }) => ({
            id: m.id,
            role: m.role,
            customRoleName: m.customRoleName,
            profile: m.profile,
          })
        );
        setMembers(list);
      })
      .catch(() => setMembers([]))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  const toggle = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      onChange(selectedMemberIds.filter((id) => id !== memberId));
    } else {
      onChange([...selectedMemberIds, memberId]);
    }
  };

  const selectedMembers = members.filter((m) =>
    selectedMemberIds.includes(m.id)
  );

  return (
    <div>
      {/* トリガーボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full px-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-600 hover:bg-gray-200 transition-colors"
      >
        <Users className="w-4 h-4 text-gray-400" />
        {selectedMembers.length === 0 ? (
          <span className="text-gray-400">タグ付け（任意）</span>
        ) : (
          <div className="flex gap-1.5 flex-wrap">
            {selectedMembers.map((m) => (
              <span
                key={m.id}
                className="px-2 py-0.5 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200"
              >
                {m.profile.name}
              </span>
            ))}
          </div>
        )}
      </button>

      {/* モーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg bg-white rounded-t-3xl pb-safe-area-inset-bottom">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">タグ付け</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* メンバー一覧 */}
            <div className="px-5 py-3 max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">
                  家族メンバーがいません
                </p>
              ) : (
                <ul className="space-y-2">
                  {members.map((member) => {
                    const isSelected = selectedMemberIds.includes(member.id);
                    return (
                      <li key={member.id}>
                        <button
                          type="button"
                          onClick={() => toggle(member.id)}
                          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          {/* アバター */}
                          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {member.profile.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={member.profile.avatarUrl}
                                alt={member.profile.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-gray-500">
                                {member.profile.name.charAt(0)}
                              </span>
                            )}
                          </div>

                          {/* 名前・役割 */}
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800">
                              {member.profile.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {getRoleLabel(member.role, member.customRoleName)}
                            </p>
                          </div>

                          {/* チェック */}
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected
                                ? "bg-gray-800 text-white"
                                : "border-2 border-gray-300"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* 完了ボタン */}
            <div className="px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-900 transition-colors"
              >
                {selectedMemberIds.length === 0
                  ? "閉じる"
                  : `${selectedMemberIds.length}人を選択して完了`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "./Modal";
import { RoleEditModal } from "./RoleEditModal";
import { useToast } from "@/components/ui";
import { useAuth } from "@/components/auth";
import { Loader2, User, Edit2 } from "lucide-react";
import {
  getRoleDisplayName,
  type FamilyRole,
} from "@/lib/api/family-members";

interface FamilyMemberManagementProps {
  isOpen: boolean;
  onClose: () => void;
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

export function FamilyMemberManagement({
  isOpen,
  onClose,
}: FamilyMemberManagementProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState<FamilyMemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRoleEditOpen, setIsRoleEditOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<FamilyMemberWithProfile | null>(null);

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
    }
  }, [isOpen, fetchMembers]);

  const handleEditRole = (member: FamilyMemberWithProfile) => {
    setCurrentMember(member);
    setIsRoleEditOpen(true);
  };

  const handleRoleUpdate = async () => {
    await fetchMembers();
    showToast("役割を更新しました", "success");
    setIsRoleEditOpen(false);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="家族メンバー">
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
              <p>家族メンバーがまだいません</p>
              <p className="text-sm mt-2">「家族を招待」から招待コードを生成してください</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const isMe = member.userId === user?.id;
                const displayRole = getRoleDisplayName(
                  member.role,
                  member.customRoleName
                );

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl"
                    data-testid={`family-member-${member.id}`}
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-cream-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {member.profile.avatarUrl ? (
                        <img
                          src={member.profile.avatarUrl}
                          alt={member.profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Name and Role */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 truncate">
                          {member.profile.name}
                        </p>
                        {isMe && (
                          <span className="text-xs px-2 py-0.5 bg-mare-100 text-mare-600 rounded-full flex-shrink-0">
                            あなた
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{displayRole}</p>
                    </div>

                    {/* Edit button (only for self) */}
                    {isMe && (
                      <button
                        onClick={() => handleEditRole(member)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                        title="役割を編集"
                        data-testid="edit-role-button"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Role Edit Modal */}
      {currentMember && (
        <RoleEditModal
          isOpen={isRoleEditOpen}
          onClose={() => setIsRoleEditOpen(false)}
          currentRole={currentMember.role}
          currentCustomRoleName={currentMember.customRoleName}
          onUpdate={handleRoleUpdate}
        />
      )}
    </>
  );
}

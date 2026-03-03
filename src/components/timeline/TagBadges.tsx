"use client";

import { Users } from "lucide-react";
import { FAMILY_ROLE_LABELS } from "@/lib/api/family-members";
import type { FamilyRole } from "@/lib/api/family-members";

export type TaggedMember = {
  id: string;
  role: string;
  customRoleName: string | null;
  profile: {
    name: string;
    avatarUrl: string | null;
  };
};

type TagBadgesProps = {
  tags: TaggedMember[];
};

function getRoleLabel(role: string, customRoleName: string | null): string {
  if (role === "other" && customRoleName) return customRoleName;
  return FAMILY_ROLE_LABELS[role as FamilyRole] ?? role;
}

export function TagBadges({ tags }: TagBadgesProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-3">
      <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      {tags.map((member) => (
        <span
          key={member.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium"
        >
          <span>{member.profile.name}</span>
          <span className="text-gray-400">({getRoleLabel(member.role, member.customRoleName)})</span>
        </span>
      ))}
    </div>
  );
}

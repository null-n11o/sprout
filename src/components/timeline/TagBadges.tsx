"use client";

import { User } from "lucide-react";
import { getRoleDisplayName, type FamilyRole } from "@/lib/api/family-members";

export type TaggedMember = {
  id: string;
  role: FamilyRole;
  customRoleName: string | null;
  profile: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

type TagBadgesProps = {
  tags: TaggedMember[];
  maxDisplay?: number;
};

export function TagBadges({ tags, maxDisplay = 3 }: TagBadgesProps) {
  if (tags.length === 0) return null;

  const displayTags = tags.slice(0, maxDisplay);
  const remainingCount = tags.length - maxDisplay;

  return (
    <div className="flex items-center gap-1.5 flex-wrap" data-testid="tag-badges">
      <User className="w-3.5 h-3.5 text-gray-400" />
      {displayTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-cream-100 text-gray-600 rounded-full text-xs"
          title={getRoleDisplayName(tag.role, tag.customRoleName)}
        >
          {tag.profile.name}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-gray-400">+{remainingCount}</span>
      )}
    </div>
  );
}

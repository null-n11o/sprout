"use client";

import { Check } from "lucide-react";
import {
  FAMILY_ROLES,
  FAMILY_ROLE_LABELS,
  type FamilyRole,
} from "@/lib/api/family-members";

interface RoleSelectorProps {
  value: FamilyRole | null;
  onChange: (role: FamilyRole) => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {FAMILY_ROLES.map((role) => {
        const isSelected = value === role;
        return (
          <button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            className={`p-3 rounded-xl border-2 text-left transition-colors ${
              isSelected
                ? "border-mare-400 bg-mare-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            data-testid={`role-option-${role}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`font-medium text-sm ${
                  isSelected ? "text-mare-600" : "text-gray-700"
                }`}
              >
                {FAMILY_ROLE_LABELS[role]}
              </span>
              {isSelected && <Check className="w-4 h-4 text-mare-500" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

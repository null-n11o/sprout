/**
 * 家族メンバー管理ロジック
 *
 * 家族メンバーの役割定義、検証、APIで使用する型を提供する
 */

import type { FamilyRole as DbFamilyRole } from "@/types/database";

// 家族役割の定数
export const FAMILY_ROLES = [
  "mother",
  "father",
  "grandmother_paternal",
  "grandmother_maternal",
  "grandfather_paternal",
  "grandfather_maternal",
  "uncle_aunt",
  "other",
] as const;

export type FamilyRole = DbFamilyRole;

// 役割の日本語ラベル
export const FAMILY_ROLE_LABELS: Record<FamilyRole, string> = {
  mother: "母",
  father: "父",
  grandmother_paternal: "祖母（父方）",
  grandmother_maternal: "祖母（母方）",
  grandfather_paternal: "祖父（父方）",
  grandfather_maternal: "祖父（母方）",
  uncle_aunt: "叔父/叔母",
  other: "その他",
};

// プロフィール情報を含む家族メンバー型
export type FamilyMemberWithProfile = {
  id: string;
  userId: string;
  role: FamilyRole;
  customRoleName: string | null;
  roleConfirmed: boolean;
  joinedAt: Date;
  profile: {
    name: string;
    avatarUrl: string | null;
  };
};

// エラー型
export type MemberError =
  | { type: "ALREADY_MEMBER"; message: string }
  | { type: "INVALID_INVITATION"; message: string }
  | { type: "INVALID_ROLE"; message: string }
  | { type: "NOT_FOUND"; message: string };

// Result型
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * 役割が有効かどうかを検証する
 */
export function validateFamilyRole(
  role: string | undefined | null
): Result<FamilyRole, MemberError> {
  if (!role || !FAMILY_ROLES.includes(role as FamilyRole)) {
    return {
      ok: false,
      error: {
        type: "INVALID_ROLE",
        message: "無効な役割が指定されました",
      },
    };
  }

  return { ok: true, value: role as FamilyRole };
}

/**
 * DBレコードをドメインオブジェクトに変換する
 */
export function toFamilyMemberWithProfile(
  member: {
    id: string;
    user_id: string;
    role: FamilyRole;
    custom_role_name: string | null;
    role_confirmed: boolean;
    joined_at: string;
  },
  profile: {
    name: string;
    avatar_url: string | null;
  }
): FamilyMemberWithProfile {
  return {
    id: member.id,
    userId: member.user_id,
    role: member.role,
    customRoleName: member.custom_role_name,
    roleConfirmed: member.role_confirmed,
    joinedAt: new Date(member.joined_at),
    profile: {
      name: profile.name,
      avatarUrl: profile.avatar_url,
    },
  };
}

/**
 * 役割の表示名を取得する
 */
export function getRoleDisplayName(
  role: FamilyRole,
  customRoleName: string | null
): string {
  if (role === "other" && customRoleName) {
    return customRoleName;
  }
  return FAMILY_ROLE_LABELS[role];
}

/**
 * 写真タグ付けロジック
 *
 * 投稿への家族メンバータグ付け・取得・検証を行う
 */

import type { FamilyRole } from "./family-members";

// UUID形式の正規表現
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// タグ付けされたメンバー情報
export type TaggedMember = {
  id: string;
  role: FamilyRole;
  customRoleName: string | null;
  profile: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  taggedAt: Date;
};

// エラー型
export type TagError =
  | { type: "POST_NOT_FOUND"; message: string }
  | { type: "MEMBER_NOT_FOUND"; message: string }
  | { type: "UNAUTHORIZED"; message: string }
  | { type: "INVALID_MEMBER_IDS"; message: string }
  | { type: "DUPLICATE_MEMBER_IDS"; message: string };

// Result型
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * メンバーID配列を検証する
 */
export function validateMemberIds(
  memberIds: string[] | null | undefined
): Result<string[], TagError> {
  // 配列でない場合
  if (!Array.isArray(memberIds)) {
    return {
      ok: false,
      error: {
        type: "INVALID_MEMBER_IDS",
        message: "memberIdsは配列である必要があります",
      },
    };
  }

  // 空配列は許可（タグ解除のケース）
  if (memberIds.length === 0) {
    return { ok: true, value: [] };
  }

  // 各IDがUUID形式か確認
  for (const id of memberIds) {
    if (typeof id !== "string" || !UUID_REGEX.test(id)) {
      return {
        ok: false,
        error: {
          type: "INVALID_MEMBER_IDS",
          message: "無効なメンバーIDが含まれています",
        },
      };
    }
  }

  // 重複チェック
  const uniqueIds = new Set(memberIds);
  if (uniqueIds.size !== memberIds.length) {
    return {
      ok: false,
      error: {
        type: "DUPLICATE_MEMBER_IDS",
        message: "重複するメンバーIDが含まれています",
      },
    };
  }

  return { ok: true, value: memberIds };
}

/**
 * DBレコードをTaggedMemberに変換する
 */
export function toTaggedMember(
  postTag: {
    id: string;
    member_id: string;
    created_at: string;
  },
  member: {
    id: string;
    role: FamilyRole;
    custom_role_name: string | null;
    profiles: {
      id: string;
      name: string;
      avatar_url: string | null;
    };
  }
): TaggedMember {
  return {
    id: member.id,
    role: member.role,
    customRoleName: member.custom_role_name,
    profile: {
      id: member.profiles.id,
      name: member.profiles.name,
      avatarUrl: member.profiles.avatar_url,
    },
    taggedAt: new Date(postTag.created_at),
  };
}

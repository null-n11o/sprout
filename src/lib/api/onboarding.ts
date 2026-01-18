/**
 * オンボーディングロジック
 *
 * 役割選択オンボーディングの状態検証を行う
 */

import type { FamilyRole } from "@/lib/api/family-members";

// オンボーディング状態の型
export type OnboardingState = {
  selectedRole: FamilyRole | null;
  customRoleName: string;
  invitationCode: string | null;
};

// エラー型
export type OnboardingError =
  | { type: "ROLE_NOT_SELECTED"; message: string }
  | { type: "CUSTOM_ROLE_REQUIRED"; message: string };

// Result型
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * オンボーディング状態を検証する
 */
export function validateOnboardingState(
  state: OnboardingState
): Result<OnboardingState, OnboardingError> {
  // 役割が選択されていない場合
  if (!state.selectedRole) {
    return {
      ok: false,
      error: {
        type: "ROLE_NOT_SELECTED",
        message: "役割を選択してください",
      },
    };
  }

  // 「その他」が選択されている場合、自由入力が必要
  if (state.selectedRole === "other" && !state.customRoleName.trim()) {
    return {
      ok: false,
      error: {
        type: "CUSTOM_ROLE_REQUIRED",
        message: "役割名を入力してください",
      },
    };
  }

  return { ok: true, value: state };
}

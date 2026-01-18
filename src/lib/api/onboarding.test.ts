/**
 * オンボーディングロジックのテスト
 */

import { describe, it, expect } from "vitest";
import {
  validateOnboardingState,
  type OnboardingState,
} from "./onboarding";

describe("validateOnboardingState", () => {
  describe("正常系", () => {
    it("役割が選択されている場合、有効と判定する", () => {
      const state: OnboardingState = {
        selectedRole: "mother",
        customRoleName: "",
        invitationCode: "ABC12345",
      };

      const result = validateOnboardingState(state);

      expect(result.ok).toBe(true);
    });

    it("その他の役割で自由入力がある場合、有効と判定する", () => {
      const state: OnboardingState = {
        selectedRole: "other",
        customRoleName: "いとこ",
        invitationCode: "ABC12345",
      };

      const result = validateOnboardingState(state);

      expect(result.ok).toBe(true);
    });

    it("招待コードがなくても役割があれば有効（既存ユーザー移行用）", () => {
      const state: OnboardingState = {
        selectedRole: "father",
        customRoleName: "",
        invitationCode: null,
      };

      const result = validateOnboardingState(state);

      expect(result.ok).toBe(true);
    });
  });

  describe("異常系", () => {
    it("役割が選択されていない場合、無効と判定する", () => {
      const state: OnboardingState = {
        selectedRole: null,
        customRoleName: "",
        invitationCode: "ABC12345",
      };

      const result = validateOnboardingState(state);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("ROLE_NOT_SELECTED");
      }
    });

    it("その他の役割で自由入力が空の場合、無効と判定する", () => {
      const state: OnboardingState = {
        selectedRole: "other",
        customRoleName: "",
        invitationCode: "ABC12345",
      };

      const result = validateOnboardingState(state);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("CUSTOM_ROLE_REQUIRED");
      }
    });

    it("その他の役割で自由入力が空白のみの場合、無効と判定する", () => {
      const state: OnboardingState = {
        selectedRole: "other",
        customRoleName: "   ",
        invitationCode: "ABC12345",
      };

      const result = validateOnboardingState(state);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("CUSTOM_ROLE_REQUIRED");
      }
    });
  });
});

describe("canSubmitOnboarding", () => {
  it("検証が成功し、送信中でない場合、送信可能", () => {
    const state: OnboardingState = {
      selectedRole: "mother",
      customRoleName: "",
      invitationCode: "ABC12345",
    };

    const result = validateOnboardingState(state);

    expect(result.ok).toBe(true);
  });
});

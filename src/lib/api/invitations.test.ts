import { describe, it, expect } from "vitest";
import {
  generateInvitationCode,
  isCodeValid,
  CONFUSING_CHARS,
  validateInvitationResult,
  type Invitation,
  type InvitationError,
} from "./invitations";

describe("generateInvitationCode", () => {
  describe("コード生成", () => {
    it("8文字の英数字コードを生成する", () => {
      const code = generateInvitationCode();

      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    it("紛らわしい文字（0, O, I, 1, L）を含まない", () => {
      // 複数回生成して確認
      for (let i = 0; i < 100; i++) {
        const code = generateInvitationCode();

        for (const char of CONFUSING_CHARS) {
          expect(code).not.toContain(char);
        }
      }
    });

    it("毎回異なるコードを生成する", () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateInvitationCode());
      }

      // 100回生成して全て異なることを確認（衝突確率は極めて低い）
      expect(codes.size).toBe(100);
    });
  });
});

describe("isCodeValid", () => {
  describe("コードフォーマット検証", () => {
    it("8文字の英数字コードを有効と判定する", () => {
      expect(isCodeValid("ABCD2345")).toBe(true);
      expect(isCodeValid("XYZ98765")).toBe(true);
    });

    it("8文字未満のコードを無効と判定する", () => {
      expect(isCodeValid("ABC1234")).toBe(false);
      expect(isCodeValid("")).toBe(false);
    });

    it("8文字超のコードを無効と判定する", () => {
      expect(isCodeValid("ABCD23456")).toBe(false);
    });

    it("小文字を含むコードを無効と判定する", () => {
      expect(isCodeValid("abcd2345")).toBe(false);
      expect(isCodeValid("ABCd2345")).toBe(false);
    });

    it("特殊文字を含むコードを無効と判定する", () => {
      expect(isCodeValid("ABC@2345")).toBe(false);
      expect(isCodeValid("ABC-2345")).toBe(false);
    });
  });
});

describe("validateInvitationResult", () => {
  const now = new Date("2024-01-15T12:00:00Z");

  describe("正常系", () => {
    it("有効な招待を成功と判定する", () => {
      const invitation: Invitation = {
        id: "inv-1",
        code: "ABCD2345",
        createdBy: "user-1",
        expiresAt: new Date("2024-01-20T12:00:00Z"),
        usedCount: 0,
        maxUses: 1,
        isActive: true,
      };

      const result = validateInvitationResult(invitation, now);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(invitation);
      }
    });
  });

  describe("期限切れ", () => {
    it("有効期限切れの招待をエラーと判定する", () => {
      const invitation: Invitation = {
        id: "inv-1",
        code: "ABCD2345",
        createdBy: "user-1",
        expiresAt: new Date("2024-01-10T12:00:00Z"), // 過去の日付
        usedCount: 0,
        maxUses: 1,
        isActive: true,
      };

      const result = validateInvitationResult(invitation, now);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("EXPIRED");
      }
    });
  });

  describe("使用回数上限", () => {
    it("使用回数が上限に達した招待をエラーと判定する", () => {
      const invitation: Invitation = {
        id: "inv-1",
        code: "ABCD2345",
        createdBy: "user-1",
        expiresAt: new Date("2024-01-20T12:00:00Z"),
        usedCount: 1,
        maxUses: 1,
        isActive: true,
      };

      const result = validateInvitationResult(invitation, now);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("MAX_USES_REACHED");
      }
    });

    it("使用回数が上限未満の招待を有効と判定する", () => {
      const invitation: Invitation = {
        id: "inv-1",
        code: "ABCD2345",
        createdBy: "user-1",
        expiresAt: new Date("2024-01-20T12:00:00Z"),
        usedCount: 0,
        maxUses: 1,
        isActive: true,
      };

      const result = validateInvitationResult(invitation, now);

      expect(result.ok).toBe(true);
    });
  });

  describe("無効化フラグ", () => {
    it("無効化された招待をエラーと判定する", () => {
      const invitation: Invitation = {
        id: "inv-1",
        code: "ABCD2345",
        createdBy: "user-1",
        expiresAt: new Date("2024-01-20T12:00:00Z"),
        usedCount: 0,
        maxUses: 1,
        isActive: false,
      };

      const result = validateInvitationResult(invitation, now);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });
  });

  describe("エラー優先順位", () => {
    it("複数のエラー条件がある場合、適切なエラーを返す", () => {
      // 無効化 + 期限切れ + 使用上限 の場合
      const invitation: Invitation = {
        id: "inv-1",
        code: "ABCD2345",
        createdBy: "user-1",
        expiresAt: new Date("2024-01-10T12:00:00Z"),
        usedCount: 1,
        maxUses: 1,
        isActive: false,
      };

      const result = validateInvitationResult(invitation, now);

      // isActive=false が最初にチェックされる
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });
  });
});

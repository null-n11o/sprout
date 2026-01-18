import { describe, it, expect } from "vitest";
import {
  FAMILY_ROLES,
  FAMILY_ROLE_LABELS,
  validateFamilyRole,
  toFamilyMemberWithProfile,
  getRoleDisplayName,
  type FamilyRole,
  type FamilyMemberWithProfile,
  type MemberError,
} from "./family-members";

describe("FAMILY_ROLES", () => {
  it("9種類の家族役割を定義している", () => {
    expect(FAMILY_ROLES).toHaveLength(8);
    expect(FAMILY_ROLES).toContain("mother");
    expect(FAMILY_ROLES).toContain("father");
    expect(FAMILY_ROLES).toContain("grandmother_paternal");
    expect(FAMILY_ROLES).toContain("grandmother_maternal");
    expect(FAMILY_ROLES).toContain("grandfather_paternal");
    expect(FAMILY_ROLES).toContain("grandfather_maternal");
    expect(FAMILY_ROLES).toContain("uncle_aunt");
    expect(FAMILY_ROLES).toContain("other");
  });
});

describe("FAMILY_ROLE_LABELS", () => {
  it("各役割に日本語ラベルが定義されている", () => {
    expect(FAMILY_ROLE_LABELS.mother).toBe("母");
    expect(FAMILY_ROLE_LABELS.father).toBe("父");
    expect(FAMILY_ROLE_LABELS.grandmother_paternal).toBe("祖母（父方）");
    expect(FAMILY_ROLE_LABELS.grandmother_maternal).toBe("祖母（母方）");
    expect(FAMILY_ROLE_LABELS.grandfather_paternal).toBe("祖父（父方）");
    expect(FAMILY_ROLE_LABELS.grandfather_maternal).toBe("祖父（母方）");
    expect(FAMILY_ROLE_LABELS.uncle_aunt).toBe("叔父/叔母");
    expect(FAMILY_ROLE_LABELS.other).toBe("その他");
  });
});

describe("validateFamilyRole", () => {
  describe("正常系", () => {
    it("有効な役割を受け入れる", () => {
      const validRoles: FamilyRole[] = [
        "mother",
        "father",
        "grandmother_paternal",
        "grandmother_maternal",
        "grandfather_paternal",
        "grandfather_maternal",
        "uncle_aunt",
        "other",
      ];

      for (const role of validRoles) {
        const result = validateFamilyRole(role);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(role);
        }
      }
    });
  });

  describe("異常系", () => {
    it("無効な役割を拒否する", () => {
      const result = validateFamilyRole("invalid_role");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_ROLE");
      }
    });

    it("空文字列を拒否する", () => {
      const result = validateFamilyRole("");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_ROLE");
      }
    });

    it("undefinedを拒否する", () => {
      const result = validateFamilyRole(undefined as unknown as string);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_ROLE");
      }
    });
  });
});

describe("toFamilyMemberWithProfile", () => {
  it("DBレコードをドメインオブジェクトに変換する", () => {
    const member = {
      id: "member-1",
      user_id: "user-1",
      role: "mother" as FamilyRole,
      custom_role_name: null,
      role_confirmed: true,
      joined_at: "2024-01-15T12:00:00Z",
    };

    const profile = {
      name: "田中 花子",
      avatar_url: "https://example.com/avatar.jpg",
    };

    const result = toFamilyMemberWithProfile(member, profile);

    expect(result).toEqual({
      id: "member-1",
      userId: "user-1",
      role: "mother",
      customRoleName: null,
      roleConfirmed: true,
      joinedAt: new Date("2024-01-15T12:00:00Z"),
      profile: {
        name: "田中 花子",
        avatarUrl: "https://example.com/avatar.jpg",
      },
    });
  });

  it("custom_role_nameとavatar_urlがnullでも変換できる", () => {
    const member = {
      id: "member-2",
      user_id: "user-2",
      role: "other" as FamilyRole,
      custom_role_name: "いとこ",
      role_confirmed: false,
      joined_at: "2024-02-20T10:00:00Z",
    };

    const profile = {
      name: "佐藤 太郎",
      avatar_url: null,
    };

    const result = toFamilyMemberWithProfile(member, profile);

    expect(result.customRoleName).toBe("いとこ");
    expect(result.profile.avatarUrl).toBeNull();
  });
});

describe("getRoleDisplayName", () => {
  describe("定義済み役割", () => {
    it("motherは「母」を返す", () => {
      expect(getRoleDisplayName("mother", null)).toBe("母");
    });

    it("fatherは「父」を返す", () => {
      expect(getRoleDisplayName("father", null)).toBe("父");
    });

    it("grandmother_paternalは「祖母（父方）」を返す", () => {
      expect(getRoleDisplayName("grandmother_paternal", null)).toBe("祖母（父方）");
    });

    it("grandmother_maternalは「祖母（母方）」を返す", () => {
      expect(getRoleDisplayName("grandmother_maternal", null)).toBe("祖母（母方）");
    });

    it("grandfather_paternalは「祖父（父方）」を返す", () => {
      expect(getRoleDisplayName("grandfather_paternal", null)).toBe("祖父（父方）");
    });

    it("grandfather_maternalは「祖父（母方）」を返す", () => {
      expect(getRoleDisplayName("grandfather_maternal", null)).toBe("祖父（母方）");
    });

    it("uncle_auntは「叔父/叔母」を返す", () => {
      expect(getRoleDisplayName("uncle_aunt", null)).toBe("叔父/叔母");
    });
  });

  describe("その他役割", () => {
    it("otherでcustomRoleNameがある場合はその名前を返す", () => {
      expect(getRoleDisplayName("other", "いとこ")).toBe("いとこ");
    });

    it("otherでcustomRoleNameがnullの場合は「その他」を返す", () => {
      expect(getRoleDisplayName("other", null)).toBe("その他");
    });
  });
});

import { describe, it, expect } from "vitest";
import {
  validateMemberIds,
  toTaggedMember,
} from "./post-tags";

describe("validateMemberIds", () => {
  describe("正常系", () => {
    it("有効なUUID配列を受け入れる", () => {
      const memberIds = [
        "123e4567-e89b-12d3-a456-426614174000",
        "223e4567-e89b-12d3-a456-426614174001",
      ];

      const result = validateMemberIds(memberIds);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(memberIds);
      }
    });

    it("空配列を受け入れる（タグ解除のケース）", () => {
      const result = validateMemberIds([]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it("単一要素の配列を受け入れる", () => {
      const memberIds = ["123e4567-e89b-12d3-a456-426614174000"];

      const result = validateMemberIds(memberIds);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
      }
    });
  });

  describe("異常系", () => {
    it("無効なUUIDを含む配列を拒否する", () => {
      const memberIds = ["invalid-uuid", "123e4567-e89b-12d3-a456-426614174000"];

      const result = validateMemberIds(memberIds);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_MEMBER_IDS");
      }
    });

    it("配列でない値を拒否する", () => {
      const result = validateMemberIds("not-an-array" as unknown as string[]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_MEMBER_IDS");
      }
    });

    it("nullを拒否する", () => {
      const result = validateMemberIds(null as unknown as string[]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_MEMBER_IDS");
      }
    });

    it("重複するIDを含む配列を拒否する", () => {
      const duplicateId = "123e4567-e89b-12d3-a456-426614174000";
      const memberIds = [duplicateId, duplicateId];

      const result = validateMemberIds(memberIds);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("DUPLICATE_MEMBER_IDS");
      }
    });
  });
});

describe("toTaggedMember", () => {
  it("DBレコードをTaggedMemberに変換する", () => {
    const postTag = {
      id: "tag-1",
      member_id: "member-1",
      created_at: "2024-01-15T12:00:00Z",
    };

    const member = {
      id: "member-1",
      role: "mother" as const,
      custom_role_name: null,
      profiles: {
        id: "user-1",
        name: "田中 花子",
        avatar_url: "https://example.com/avatar.jpg",
      },
    };

    const result = toTaggedMember(postTag, member);

    expect(result).toEqual({
      id: "member-1",
      role: "mother",
      customRoleName: null,
      profile: {
        id: "user-1",
        name: "田中 花子",
        avatarUrl: "https://example.com/avatar.jpg",
      },
      taggedAt: new Date("2024-01-15T12:00:00Z"),
    });
  });

  it("custom_role_nameとavatar_urlがnullでも変換できる", () => {
    const postTag = {
      id: "tag-2",
      member_id: "member-2",
      created_at: "2024-02-20T10:00:00Z",
    };

    const member = {
      id: "member-2",
      role: "other" as const,
      custom_role_name: "いとこ",
      profiles: {
        id: "user-2",
        name: "佐藤 太郎",
        avatar_url: null,
      },
    };

    const result = toTaggedMember(postTag, member);

    expect(result.customRoleName).toBe("いとこ");
    expect(result.profile.avatarUrl).toBeNull();
  });
});

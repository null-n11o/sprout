import { describe, it, expect } from "vitest";
import {
  validateYearMonth,
  calculateMonthRange,
  calculateMonthDateRange,
} from "./date-utils";

describe("validateYearMonth", () => {
  describe("正常系", () => {
    it("有効な年月を受け入れる", () => {
      expect(validateYearMonth(2024, 1)).toBe(true);
      expect(validateYearMonth(2024, 12)).toBe(true);
      expect(validateYearMonth(2000, 6)).toBe(true);
      expect(validateYearMonth(2100, 6)).toBe(true);
    });
  });

  describe("境界値", () => {
    it("2000年は有効", () => {
      expect(validateYearMonth(2000, 1)).toBe(true);
    });

    it("2100年は有効", () => {
      expect(validateYearMonth(2100, 12)).toBe(true);
    });

    it("1月は有効", () => {
      expect(validateYearMonth(2024, 1)).toBe(true);
    });

    it("12月は有効", () => {
      expect(validateYearMonth(2024, 12)).toBe(true);
    });
  });

  describe("異常系", () => {
    it("月が0以下の場合はfalseを返す", () => {
      expect(validateYearMonth(2024, 0)).toBe(false);
      expect(validateYearMonth(2024, -1)).toBe(false);
    });

    it("月が13以上の場合はfalseを返す", () => {
      expect(validateYearMonth(2024, 13)).toBe(false);
      expect(validateYearMonth(2024, 100)).toBe(false);
    });

    it("年が1999以下の場合はfalseを返す", () => {
      expect(validateYearMonth(1999, 6)).toBe(false);
      expect(validateYearMonth(1000, 6)).toBe(false);
    });

    it("年が2101以上の場合はfalseを返す", () => {
      expect(validateYearMonth(2101, 6)).toBe(false);
    });

    it("NaNの場合はfalseを返す", () => {
      expect(validateYearMonth(NaN, 6)).toBe(false);
      expect(validateYearMonth(2024, NaN)).toBe(false);
    });
  });
});

describe("calculateMonthRange", () => {
  describe("正常系", () => {
    it("月の開始日と終了日をISO文字列で返す", () => {
      const range = calculateMonthRange(2024, 1);
      expect(range.startDate).toBe("2024-01-01T00:00:00.000Z");
    });

    it("月末日を正しく計算する（31日の月）", () => {
      const range = calculateMonthRange(2024, 1); // 1月は31日
      const endDate = new Date(range.endDate);
      expect(endDate.getUTCDate()).toBe(31);
    });

    it("月末日を正しく計算する（30日の月）", () => {
      const range = calculateMonthRange(2024, 4); // 4月は30日
      const endDate = new Date(range.endDate);
      expect(endDate.getUTCDate()).toBe(30);
    });

    it("うるう年の2月を正しく計算する", () => {
      const range = calculateMonthRange(2024, 2); // 2024年はうるう年
      const endDate = new Date(range.endDate);
      expect(endDate.getUTCDate()).toBe(29);
    });

    it("うるう年でない2月を正しく計算する", () => {
      const range = calculateMonthRange(2023, 2); // 2023年は平年
      const endDate = new Date(range.endDate);
      expect(endDate.getUTCDate()).toBe(28);
    });
  });
});

describe("calculateMonthDateRange", () => {
  describe("正常系", () => {
    it("月のYYYY-MM-DD形式の開始日と終了日を返す", () => {
      const range = calculateMonthDateRange(2024, 3);
      expect(range.monthStart).toBe("2024-03-01");
      expect(range.monthEnd).toBe("2024-03-31");
    });

    it("月が1桁の場合は0埋めする", () => {
      const range = calculateMonthDateRange(2024, 1);
      expect(range.monthStart).toBe("2024-01-01");
    });

    it("2月の終了日を正しく計算する", () => {
      const range = calculateMonthDateRange(2024, 2); // うるう年
      expect(range.monthEnd).toBe("2024-02-29");
    });
  });
});

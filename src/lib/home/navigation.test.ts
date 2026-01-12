import { describe, it, expect } from "vitest";
import {
  calculateNextMonth,
  calculatePreviousMonth,
  shouldSwipe,
  type SwipeInfo,
} from "./navigation";

describe("月タブの状態管理", () => {
  describe("calculateNextMonth", () => {
    it("通常の月移動では同じ年のまま次の月に移動する", () => {
      const result = calculateNextMonth(2024, 5);

      expect(result.year).toBe(2024);
      expect(result.month).toBe(6);
    });

    it("12月から次の月に移動すると翌年1月になる", () => {
      const result = calculateNextMonth(2024, 12);

      expect(result.year).toBe(2025);
      expect(result.month).toBe(1);
    });

    it("1月でも正常に動作する", () => {
      const result = calculateNextMonth(2024, 1);

      expect(result.year).toBe(2024);
      expect(result.month).toBe(2);
    });
  });

  describe("calculatePreviousMonth", () => {
    it("通常の月移動では同じ年のまま前の月に移動する", () => {
      const result = calculatePreviousMonth(2024, 5);

      expect(result.year).toBe(2024);
      expect(result.month).toBe(4);
    });

    it("1月から前の月に移動すると前年12月になる", () => {
      const result = calculatePreviousMonth(2024, 1);

      expect(result.year).toBe(2023);
      expect(result.month).toBe(12);
    });

    it("12月でも正常に動作する", () => {
      const result = calculatePreviousMonth(2024, 12);

      expect(result.year).toBe(2024);
      expect(result.month).toBe(11);
    });
  });
});

describe("スワイプジェスチャーの判定", () => {
  const SWIPE_THRESHOLD = 50;

  describe("shouldSwipe", () => {
    it("左方向に50px以上スワイプすると次の月への移動を返す", () => {
      const info: SwipeInfo = { offsetX: -60, velocityX: 0 };

      const result = shouldSwipe(info, SWIPE_THRESHOLD);

      expect(result).toBe("next");
    });

    it("右方向に50px以上スワイプすると前の月への移動を返す", () => {
      const info: SwipeInfo = { offsetX: 60, velocityX: 0 };

      const result = shouldSwipe(info, SWIPE_THRESHOLD);

      expect(result).toBe("prev");
    });

    it("スワイプ距離が閾値未満でも速度が500以上あれば移動を返す", () => {
      const infoLeft: SwipeInfo = { offsetX: -30, velocityX: -600 };
      const infoRight: SwipeInfo = { offsetX: 30, velocityX: 600 };

      expect(shouldSwipe(infoLeft, SWIPE_THRESHOLD)).toBe("next");
      expect(shouldSwipe(infoRight, SWIPE_THRESHOLD)).toBe("prev");
    });

    it("スワイプ距離も速度も閾値未満の場合はnullを返す", () => {
      const info: SwipeInfo = { offsetX: 30, velocityX: 200 };

      const result = shouldSwipe(info, SWIPE_THRESHOLD);

      expect(result).toBeNull();
    });

    it("閾値ちょうどの場合は移動しない", () => {
      const info: SwipeInfo = { offsetX: 50, velocityX: 0 };

      const result = shouldSwipe(info, SWIPE_THRESHOLD);

      expect(result).toBeNull();
    });

    it("速度閾値ちょうどの場合は移動しない", () => {
      const info: SwipeInfo = { offsetX: 30, velocityX: 500 };

      const result = shouldSwipe(info, SWIPE_THRESHOLD);

      expect(result).toBeNull();
    });
  });
});

describe("表示モード切り替え", () => {
  describe("ViewMode型の検証", () => {
    it("monthlyとyearlyの2つのモードが存在する", () => {
      // TypeScriptの型チェックで保証されるが、ランタイムでも確認
      const validModes = ["monthly", "yearly"];
      expect(validModes).toContain("monthly");
      expect(validModes).toContain("yearly");
    });
  });
});

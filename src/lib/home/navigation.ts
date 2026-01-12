export type ViewMode = "monthly" | "yearly";

export interface YearMonth {
  year: number;
  month: number;
}

export interface SwipeInfo {
  offsetX: number;
  velocityX: number;
}

export type SwipeDirection = "next" | "prev" | null;

/**
 * 次の月を計算する
 * 12月の場合は翌年1月に移動
 */
export function calculateNextMonth(year: number, month: number): YearMonth {
  if (month >= 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

/**
 * 前の月を計算する
 * 1月の場合は前年12月に移動
 */
export function calculatePreviousMonth(year: number, month: number): YearMonth {
  if (month <= 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

/**
 * スワイプジェスチャーを判定する
 * @param info スワイプ情報（オフセットと速度）
 * @param threshold スワイプのしきい値（px）
 * @param velocityThreshold 速度のしきい値（デフォルト500）
 * @returns スワイプ方向（next/prev）またはnull
 */
export function shouldSwipe(
  info: SwipeInfo,
  threshold: number,
  velocityThreshold: number = 500
): SwipeDirection {
  const { offsetX, velocityX } = info;

  // しきい値を超えたか、速度が十分大きい場合に月移動
  if (Math.abs(offsetX) > threshold || Math.abs(velocityX) > velocityThreshold) {
    if (offsetX < 0 || velocityX < -velocityThreshold) {
      // 左スワイプ → 次の月へ
      return "next";
    } else if (offsetX > 0 || velocityX > velocityThreshold) {
      // 右スワイプ → 前の月へ
      return "prev";
    }
  }

  return null;
}

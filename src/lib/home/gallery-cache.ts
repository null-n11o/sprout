// キャッシュのキーを生成
export function getCacheKey(
  year: number,
  month: number,
  childId: string | null
) {
  return `${year}-${month}-${childId || "all"}`;
}

// キャッシュの有効期限（60秒）
export const CACHE_TTL = 60 * 1000;

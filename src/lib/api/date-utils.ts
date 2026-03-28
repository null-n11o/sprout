export interface MonthISORange {
  startDate: string;
  endDate: string;
}

export interface MonthDateRange {
  monthStart: string;
  monthEnd: string;
}

/**
 * 年月の妥当性を検証する
 * @param year 年（2000〜2100が有効）
 * @param month 月（1〜12が有効）
 * @returns 有効な場合はtrue
 */
export function validateYearMonth(year: number, month: number): boolean {
  if (isNaN(year) || isNaN(month)) return false;
  if (month < 1 || month > 12) return false;
  if (year < 2000 || year > 2100) return false;
  return true;
}

/**
 * 月の開始日時と終了日時をISO文字列で返す
 * Supabaseのcreated_at (timestamptz) フィールドのフィルタに使用
 */
export function calculateMonthRange(year: number, month: number): MonthISORange {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const endDate = new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999));
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

/**
 * 月の開始日と終了日をYYYY-MM-DD形式で返す
 * Supabaseのrecorded_at (date) フィールドのフィルタに使用
 */
export function calculateMonthDateRange(year: number, month: number): MonthDateRange {
  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dd = String(lastDay).padStart(2, "0");
  return {
    monthStart: `${year}-${mm}-01`,
    monthEnd: `${year}-${mm}-${dd}`,
  };
}

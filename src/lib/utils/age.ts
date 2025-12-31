/**
 * 生年月日から指定日時点での月齢を計算する
 */
export function calculateMonthAge(
  birthDate: string | Date,
  targetDate: string | Date = new Date()
): number {
  const birth = new Date(birthDate);
  const target = new Date(targetDate);

  const years = target.getFullYear() - birth.getFullYear();
  const months = target.getMonth() - birth.getMonth();

  let totalMonths = years * 12 + months;

  // 日付が誕生日より前の場合は1ヶ月引く
  if (target.getDate() < birth.getDate()) {
    totalMonths -= 1;
  }

  return Math.max(0, totalMonths);
}

/**
 * 月齢を「○歳○ヶ月」形式でフォーマットする
 */
export function formatMonthAge(months: number): string {
  if (months < 0) return "0ヶ月";

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths}ヶ月`;
  }

  if (remainingMonths === 0) {
    return `${years}歳`;
  }

  return `${years}歳${remainingMonths}ヶ月`;
}

/**
 * 生年月日から指定日時点での月齢を「○歳○ヶ月」形式で取得する
 */
export function getFormattedAge(
  birthDate: string | Date,
  targetDate: string | Date = new Date()
): string {
  const months = calculateMonthAge(birthDate, targetDate);
  return formatMonthAge(months);
}

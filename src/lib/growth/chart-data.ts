import { calculateMonthAge } from "@/lib/utils";

export type GrowthRecord = {
  id: string;
  child_id: string;
  height: number;
  weight: number;
  memo: string | null;
  recorded_at: string;
  child: {
    id: string;
    name: string;
    birth_date: string;
  };
};

export type ChartDataPoint = {
  monthAge: number;
  height: number;
  weight: number;
  childName: string;
  date: string;
  recordedAt: string;
};

// サンプルデータ（典型的な乳幼児の成長推移）
export const SAMPLE_DATA = [
  { monthAge: 0, height: 50.0, weight: 3.0 },
  { monthAge: 1, height: 54.0, weight: 4.2 },
  { monthAge: 2, height: 57.5, weight: 5.2 },
  { monthAge: 3, height: 60.5, weight: 6.0 },
  { monthAge: 4, height: 63.0, weight: 6.7 },
  { monthAge: 5, height: 65.0, weight: 7.2 },
  { monthAge: 6, height: 67.0, weight: 7.7 },
  { monthAge: 9, height: 71.5, weight: 8.7 },
  { monthAge: 12, height: 75.0, weight: 9.5 },
  { monthAge: 18, height: 81.0, weight: 10.5 },
  { monthAge: 24, height: 86.0, weight: 11.8 },
];

/**
 * サンプルタブ用のチャートデータを生成する
 */
export function buildSampleChartData(): ChartDataPoint[] {
  return SAMPLE_DATA.map((d) => ({
    ...d,
    childName: "サンプル",
    date: `${d.monthAge}ヶ月時点`,
    recordedAt: "",
  }));
}

/**
 * 指定した子供の成長記録からチャートデータを生成する
 * 同じ月齢に複数レコードがある場合は最新のものを使用
 */
export function buildChildChartData(
  records: GrowthRecord[],
  childId: string
): ChartDataPoint[] {
  const filteredRecords = records
    .filter((r) => r.child_id === childId)
    .map((record) => {
      const monthAge = calculateMonthAge(
        record.child.birth_date,
        record.recorded_at
      );
      return {
        monthAge,
        height: Number(record.height),
        weight: Number(record.weight),
        childName: record.child.name,
        date: new Date(record.recorded_at).toLocaleDateString("ja-JP"),
        recordedAt: record.recorded_at,
      };
    });

  // 月齢ごとに最新のレコードのみを保持
  const latestByMonthAge = new Map<number, (typeof filteredRecords)[0]>();
  for (const record of filteredRecords) {
    const existing = latestByMonthAge.get(record.monthAge);
    if (!existing || record.recordedAt > existing.recordedAt) {
      latestByMonthAge.set(record.monthAge, record);
    }
  }

  return Array.from(latestByMonthAge.values()).sort(
    (a, b) => a.monthAge - b.monthAge
  );
}

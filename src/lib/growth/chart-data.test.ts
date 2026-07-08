import { describe, it, expect } from "vitest";
import {
  SAMPLE_DATA,
  buildSampleChartData,
  buildChildChartData,
  GrowthRecord,
} from "./chart-data";

function makeRecord(overrides: Partial<GrowthRecord> = {}): GrowthRecord {
  return {
    id: "record-1",
    child_id: "child-1",
    height: 70.5,
    weight: 8.2,
    memo: null,
    recorded_at: "2024-07-15T00:00:00",
    child: {
      id: "child-1",
      name: "カイリ",
      birth_date: "2024-01-10T00:00:00",
    },
    ...overrides,
  };
}

describe("buildSampleChartData", () => {
  it("サンプルデータと同じ件数のデータを生成する", () => {
    expect(buildSampleChartData()).toHaveLength(SAMPLE_DATA.length);
    expect(buildSampleChartData()).toHaveLength(11);
  });

  it("各ポイントにchildName・date・recordedAtを付与する", () => {
    const result = buildSampleChartData();
    expect(result[0]).toEqual({
      monthAge: 0,
      height: 50.0,
      weight: 3.0,
      childName: "サンプル",
      date: "0ヶ月時点",
      recordedAt: "",
    });
    expect(result[10]).toEqual({
      monthAge: 24,
      height: 86.0,
      weight: 11.8,
      childName: "サンプル",
      date: "24ヶ月時点",
      recordedAt: "",
    });
  });
});

describe("buildChildChartData", () => {
  it("レコードをチャートデータポイントに変換する", () => {
    const records = [makeRecord()];
    const result = buildChildChartData(records, "child-1");

    expect(result).toEqual([
      {
        monthAge: 6,
        height: 70.5,
        weight: 8.2,
        childName: "カイリ",
        date: new Date("2024-07-15T00:00:00").toLocaleDateString("ja-JP"),
        recordedAt: "2024-07-15T00:00:00",
      },
    ]);
  });

  it("指定した子供のレコードのみを対象にする", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "child-1" }),
      makeRecord({ id: "r2", child_id: "child-2" }),
    ];
    expect(buildChildChartData(records, "child-1")).toHaveLength(1);
    expect(buildChildChartData(records, "child-2")).toHaveLength(1);
    expect(buildChildChartData(records, "child-3")).toHaveLength(0);
  });

  it("同じ月齢に複数レコードがある場合は最新のものを使用する", () => {
    const records = [
      makeRecord({
        id: "r1",
        height: 70.0,
        weight: 8.0,
        recorded_at: "2024-07-12T00:00:00",
      }),
      makeRecord({
        id: "r2",
        height: 70.5,
        weight: 8.2,
        recorded_at: "2024-07-20T00:00:00",
      }),
    ];
    const result = buildChildChartData(records, "child-1");

    expect(result).toHaveLength(1);
    expect(result[0].height).toBe(70.5);
    expect(result[0].weight).toBe(8.2);
    expect(result[0].recordedAt).toBe("2024-07-20T00:00:00");
  });

  it("月齢の昇順にソートする", () => {
    const records = [
      makeRecord({ id: "r1", recorded_at: "2024-10-15T00:00:00" }),
      makeRecord({ id: "r2", recorded_at: "2024-03-15T00:00:00" }),
      makeRecord({ id: "r3", recorded_at: "2024-07-15T00:00:00" }),
    ];
    const result = buildChildChartData(records, "child-1");

    expect(result.map((p) => p.monthAge)).toEqual([2, 6, 9]);
  });

  it("記録日が誕生日の日付より前の月は月齢を1ヶ月引く", () => {
    // 誕生日は10日。7月5日時点では6ヶ月に達していないため5ヶ月
    const records = [makeRecord({ recorded_at: "2024-07-05T00:00:00" })];
    const result = buildChildChartData(records, "child-1");

    expect(result[0].monthAge).toBe(5);
  });

  it("height・weightを数値に変換する", () => {
    const records = [
      makeRecord({
        height: "70.5" as unknown as number,
        weight: "8.2" as unknown as number,
      }),
    ];
    const result = buildChildChartData(records, "child-1");

    expect(result[0].height).toBe(70.5);
    expect(result[0].weight).toBe(8.2);
  });

  it("レコードが空の場合は空配列を返す", () => {
    expect(buildChildChartData([], "child-1")).toEqual([]);
  });
});

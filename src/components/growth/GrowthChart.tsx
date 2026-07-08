"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  GrowthRecord,
  buildSampleChartData,
  buildChildChartData,
} from "@/lib/growth/chart-data";

type Child = {
  id: string;
  name: string;
  birth_date: string;
};

type GrowthChartProps = {
  records: GrowthRecord[];
  childList: Child[];
};

type ChartType = "height" | "weight";

export function GrowthChart({ records, childList }: GrowthChartProps) {
  const [selectedTab, setSelectedTab] = useState<string>("sample");
  const [chartType, setChartType] = useState<ChartType>("height");

  // 最初の子供がいればそれを選択、なければサンプル
  useEffect(() => {
    if (childList.length > 0) {
      setSelectedTab(childList[0].id);
    }
  }, [childList]);

  const isSampleTab = selectedTab === "sample";

  // 選択されたタブに応じてデータを取得
  // 同じ月齢に複数レコードがある場合は最新のものを使用
  const chartData = isSampleTab
    ? buildSampleChartData()
    : buildChildChartData(records, selectedTab);

  return (
    <div className="space-y-4">
      {/* フィルター */}
      <div className="flex gap-2 overflow-x-auto py-2">
        {childList.map((child) => {
          const isSelected = selectedTab === child.id;
          const colorClass =
            child.name === "カイリ"
              ? isSelected
                ? "bg-kairi-500 text-white"
                : "bg-kairi-100 text-kairi-600 hover:bg-kairi-200"
              : isSelected
                ? "bg-mare-500 text-white"
                : "bg-mare-100 text-mare-600 hover:bg-mare-200";

          return (
            <button
              key={child.id}
              onClick={() => setSelectedTab(child.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${colorClass}`}
            >
              {child.name}
            </button>
          );
        })}
        <button
          onClick={() => setSelectedTab("sample")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            isSampleTab
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          サンプル
        </button>
      </div>

      {/* グラフタイプ切り替え */}
      <div className="flex gap-2">
        <button
          onClick={() => setChartType("height")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            chartType === "height"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          身長
        </button>
        <button
          onClick={() => setChartType("weight")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            chartType === "weight"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          体重
        </button>
      </div>

      {/* グラフ */}
      {chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          まだ記録がありません
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="monthAge"
                tickFormatter={(value) => `${value}ヶ月`}
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) =>
                  chartType === "height" ? `${value}cm` : `${value}kg`
                }
              />
              <Tooltip
                formatter={(value, name) => [
                  chartType === "height" ? `${value} cm` : `${value} kg`,
                  name === "height" ? "身長" : "体重",
                ]}
                labelFormatter={(label) => `${label}ヶ月`}
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend
                formatter={(value) => (value === "height" ? "身長" : "体重")}
              />
              <Line
                type="monotone"
                dataKey={chartType}
                stroke={chartType === "height" ? "#3b82f6" : "#22c55e"}
                strokeWidth={2}
                dot={{
                  fill: chartType === "height" ? "#3b82f6" : "#22c55e",
                  strokeWidth: 2,
                }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 記録一覧 */}
      {chartData.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">記録一覧</h3>
          <div className="space-y-2">
            {chartData
              .slice()
              .reverse()
              .map((record, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-3 shadow-sm flex justify-between items-center"
                >
                  <div>
                    <div className="text-sm text-gray-500">{record.date}</div>
                    <div className="text-xs text-gray-400">
                      {record.monthAge}ヶ月
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">身長</span>{" "}
                      <span className="font-medium">{record.height}cm</span>
                    </div>
                    <div>
                      <span className="text-gray-500">体重</span>{" "}
                      <span className="font-medium">{record.weight}kg</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

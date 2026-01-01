"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type Child = {
  id: string;
  name: string;
};

type GrowthRecordFormProps = {
  childList: Child[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function GrowthRecordForm({
  childList,
  onSuccess,
  onCancel,
}: GrowthRecordFormProps) {
  const [selectedChildId, setSelectedChildId] = useState<string>(
    childList[0]?.id || ""
  );
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [memo, setMemo] = useState("");
  const [recordedAt, setRecordedAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !height || !weight || !recordedAt) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/growth-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: selectedChildId,
          height: Number(height),
          weight: Number(weight),
          memo: memo || null,
          recorded_at: recordedAt,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "記録の保存に失敗しました");
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* 子供選択 */}
      <div className="flex gap-2">
        {childList.map((child) => {
          const isSelected = selectedChildId === child.id;
          const colorClass =
            child.name === "カイリ"
              ? isSelected
                ? "bg-kairi-500 text-white"
                : "bg-kairi-100 text-kairi-600"
              : isSelected
                ? "bg-mare-500 text-white"
                : "bg-mare-100 text-mare-600";

          return (
            <button
              key={child.id}
              type="button"
              onClick={() => setSelectedChildId(child.id)}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${colorClass}`}
            >
              {child.name}
            </button>
          );
        })}
      </div>

      {/* 日付 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          記録日
        </label>
        <input
          type="date"
          value={recordedAt}
          onChange={(e) => setRecordedAt(e.target.value)}
          className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300"
          required
        />
      </div>

      {/* 身長・体重 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            身長 (cm)
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="80.5"
            step="0.1"
            min="30"
            max="200"
            className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            体重 (kg)
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="10.2"
            step="0.1"
            min="1"
            max="100"
            className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300"
            required
          />
        </div>
      </div>

      {/* メモ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          メモ
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="健康診断の結果など..."
          className="w-full px-4 py-3 bg-gray-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
          rows={3}
        />
      </div>

      {/* ボタン */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={!height || !weight || !selectedChildId || isSubmitting}
          className="flex-1 py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              保存中...
            </>
          ) : (
            "記録する"
          )}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header, BottomNav } from "@/components/layout";
import { AuthGuard } from "@/components/auth";
import { ChildFilter } from "@/components/timeline";
import {
  MonthSelector,
  PhotoDisplay,
  GrowthStats,
  MilestoneList,
} from "@/components/monthly";
import { Loader2 } from "lucide-react";

type Child = {
  id: string;
  name: string;
};

type Photo = {
  id: string;
  media_url: string;
  created_at: string;
};

type GrowthRecord = {
  height: number | null;
  weight: number | null;
};

type Milestone = {
  id: string;
  content: string;
};

type MonthlyData = {
  photos: Photo[];
  growthRecord: GrowthRecord | null;
  milestones: Milestone[];
};

export default function MonthlyPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [data, setData] = useState<MonthlyData>({
    photos: [],
    growthRecord: null,
    milestones: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [oldestMonth, setOldestMonth] = useState<{ year: number; month: number } | null>(null);

  // 子どもリストを取得
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await fetch("/api/children");
        if (res.ok) {
          const data = await res.json();
          setChildren(data.children);
          // 最初の子どもを選択
          if (data.children.length > 0) {
            setSelectedChildId(data.children[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch children:", error);
      }
    };
    fetchChildren();
  }, []);

  // 月別データを取得
  const fetchMonthlyData = useCallback(async () => {
    if (!selectedChildId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/monthly/${year}/${month}?child_id=${selectedChildId}`
      );
      if (res.ok) {
        const result = await res.json();
        setData({
          photos: result.photos || [],
          growthRecord: result.growthRecord || null,
          milestones: result.milestones || [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch monthly data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [year, month, selectedChildId]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  // 月の移動
  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  // 現在月かどうかチェック
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  // 最古月かどうかチェック（簡易的に2020年1月を最古とする）
  const isOldestMonth = year === 2020 && month === 1;

  // ギャラリーへ遷移
  const handlePhotoTap = () => {
    router.push(`/monthly/${year}/${month}/photos${selectedChildId ? `?child_id=${selectedChildId}` : ""}`);
  };

  // マイルストーン追加
  const handleAddMilestone = async (content: string) => {
    if (!selectedChildId) return;

    const res = await fetch("/api/growth-milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        child_id: selectedChildId,
        content,
        recorded_at: `${year}-${String(month).padStart(2, "0")}-01`,
      }),
    });

    if (res.ok) {
      fetchMonthlyData();
    }
  };

  // マイルストーン削除
  const handleDeleteMilestone = async (id: string) => {
    const res = await fetch(`/api/growth-milestones/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchMonthlyData();
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-cream-50">
        <Header />
        <main className="pt-14 pb-32 px-4">
          <div className="max-w-lg mx-auto py-4">
            <h1 className="text-xl font-bold text-gray-800 mb-4">月の記録</h1>

            {/* 子どもフィルター */}
            {children.length > 0 && (
              <ChildFilter
                selectedChildId={selectedChildId}
                onSelect={setSelectedChildId}
                childList={children}
              />
            )}

            {/* 月選択 */}
            <MonthSelector
              year={year}
              month={month}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              hasPrevMonth={!isOldestMonth}
              hasNextMonth={!isCurrentMonth}
            />

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : !selectedChildId ? (
              <div className="text-center py-12">
                <p className="text-gray-500">子どもを選択してください</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 写真表示 */}
                <PhotoDisplay
                  photos={data.photos}
                  year={year}
                  month={month}
                  onPhotoTap={handlePhotoTap}
                />

                {/* 成長記録 */}
                <GrowthStats
                  height={data.growthRecord?.height ?? null}
                  weight={data.growthRecord?.weight ?? null}
                />

                {/* 成長メモ */}
                <MilestoneList
                  milestones={data.milestones}
                  childId={selectedChildId}
                  year={year}
                  month={month}
                  onAdd={handleAddMilestone}
                  onDelete={handleDeleteMilestone}
                />
              </div>
            )}
          </div>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}

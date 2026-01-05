"use client";

import { useEffect, useState, useCallback } from "react";
import { Header, BottomNav } from "@/components/layout";
import { AuthGuard } from "@/components/auth";
import { GrowthRecordForm, GrowthChart } from "@/components/growth";
import { Plus, X, Loader2 } from "lucide-react";

type Child = {
  id: string;
  name: string;
  birth_date: string;
};

type GrowthRecord = {
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

export default function GrowthPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [childrenRes, recordsRes] = await Promise.all([
        fetch("/api/children"),
        fetch("/api/growth-records"),
      ]);

      if (childrenRes.ok) {
        const data = await childrenRes.json();
        setChildren(data.children);
      }

      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(data.records);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSuccess = () => {
    setShowForm(false);
    fetchData();
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-cream-50">
        <Header />
        <main className="pt-14 pb-20 px-4">
          <div className="max-w-lg mx-auto py-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-gray-800">成長記録</h1>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  記録する
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : showForm ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    新しい記録
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <GrowthRecordForm
                  childList={children}
                  onSuccess={handleSuccess}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            ) : children.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">子供のデータがありません</p>
              </div>
            ) : (
              <GrowthChart records={records} childList={children} />
            )}
          </div>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}

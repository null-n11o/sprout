"use client";

import Image from "next/image";
import { calculateMonthAge } from "@/lib/utils";

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

type Post = {
  id: string;
  child_id: string;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  created_at: string;
  child: {
    id: string;
    name: string;
    birth_date: string;
  };
};

type SampleSectionProps = {
  records: GrowthRecord[];
  posts: Post[];
};

export function SampleSection({ records, posts }: SampleSectionProps) {
  // 最新10件の画像を取得
  const recentImages = posts
    .filter((post) => post.media_type === "image")
    .slice(0, 10);

  // 最新5件の成長記録を取得
  const recentRecords = records.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 画像ギャラリー */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">最近の写真</h3>
        {recentImages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            まだ写真がありません
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {recentImages.map((post) => (
              <div
                key={post.id}
                className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative"
              >
                <Image
                  src={post.media_url}
                  alt={post.caption || "子供の写真"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, 150px"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      post.child.name === "カイリ"
                        ? "bg-kairi-500 text-white"
                        : "bg-mare-500 text-white"
                    }`}
                  >
                    {post.child.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 成長記録サマリー */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">最近の成長記録</h3>
        {recentRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            まだ記録がありません
          </div>
        ) : (
          <div className="space-y-2">
            {recentRecords.map((record) => {
              const monthAge = calculateMonthAge(
                record.child.birth_date,
                record.recorded_at
              );
              return (
                <div
                  key={record.id}
                  className="bg-white rounded-xl p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        record.child.name === "カイリ"
                          ? "bg-kairi-100 text-kairi-600"
                          : "bg-mare-100 text-mare-600"
                      }`}
                    >
                      {record.child.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(record.recorded_at).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {monthAge}ヶ月
                    </span>
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
                  {record.memo && (
                    <p className="text-xs text-gray-500 mt-2">{record.memo}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

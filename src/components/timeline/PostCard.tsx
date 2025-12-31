"use client";

import Image from "next/image";
import { getFormattedAge } from "@/lib/utils";
import { Heart, MessageCircle } from "lucide-react";

export type PostWithDetails = {
  id: string;
  child_id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  created_at: string;
  child: {
    id: string;
    name: string;
    birth_date: string;
    avatar_url: string | null;
  };
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  reaction_count: number;
  comment_count: number;
};

type PostCardProps = {
  post: PostWithDetails;
};

export function PostCard({ post }: PostCardProps) {
  const age = getFormattedAge(post.child.birth_date, post.created_at);
  const formattedDate = new Date(post.created_at).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const childColorClass =
    post.child.name === "カイリ"
      ? "bg-kairi-100 text-kairi-600"
      : "bg-mare-100 text-mare-600";

  return (
    <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* メディア */}
      <div className="relative aspect-square bg-gray-100">
        {post.media_type === "image" ? (
          <Image
            src={post.media_url}
            alt={post.caption || "投稿画像"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 512px"
          />
        ) : (
          <video
            src={post.media_url}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
        )}
      </div>

      {/* コンテンツ */}
      <div className="p-4">
        {/* ヘッダー */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${childColorClass}`}
          >
            {post.child.name}
          </span>
          <span className="text-xs text-gray-500">{age}</span>
          <span className="text-xs text-gray-400 ml-auto">{formattedDate}</span>
        </div>

        {/* キャプション */}
        {post.caption && (
          <p className="text-gray-700 text-sm leading-relaxed mb-3">
            {post.caption}
          </p>
        )}

        {/* アクション */}
        <div className="flex items-center gap-4 text-gray-500">
          <button className="flex items-center gap-1 hover:text-rose-500 transition-colors">
            <Heart className="w-5 h-5" />
            <span className="text-sm">{post.reaction_count}</span>
          </button>
          <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comment_count}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

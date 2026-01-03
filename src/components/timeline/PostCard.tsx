"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getFormattedAge } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import { HeartButton } from "@/components/ui";
import { scaleIn, transitions } from "@/lib/animations";

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
  has_reacted: boolean;
};

type PostCardProps = {
  post: PostWithDetails;
  onCommentClick?: (postId: string) => void;
  onReactionChange?: (postId: string, hasReacted: boolean, count: number) => void;
  index?: number;
};

export function PostCard({ post, onCommentClick, onReactionChange, index = 0 }: PostCardProps) {
  const [hasReacted, setHasReacted] = useState(post.has_reacted);
  const [reactionCount, setReactionCount] = useState(post.reaction_count);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const age = getFormattedAge(post.child.birth_date, post.created_at);
  const formattedDate = new Date(post.created_at).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isKairi = post.child.name === "カイリ";
  const childColorClass = isKairi
    ? "bg-kairi-100 text-kairi-600 border-kairi-200"
    : "bg-mare-100 text-mare-600 border-mare-200";

  const handleReactionToggle = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    // Optimistic update
    const newHasReacted = !hasReacted;
    const newCount = newHasReacted ? reactionCount + 1 : reactionCount - 1;
    setHasReacted(newHasReacted);
    setReactionCount(newCount);

    try {
      const response = await fetch(`/api/posts/${post.id}/reactions`, {
        method: "POST",
      });

      if (!response.ok) {
        // Revert on error
        setHasReacted(hasReacted);
        setReactionCount(reactionCount);
        return;
      }

      const data = await response.json();
      setHasReacted(data.hasReacted);
      setReactionCount(data.count);
      onReactionChange?.(post.id, data.hasReacted, data.count);
    } catch {
      // Revert on error
      setHasReacted(hasReacted);
      setReactionCount(reactionCount);
    } finally {
      setIsLoading(false);
    }
  }, [hasReacted, reactionCount, isLoading, post.id, onReactionChange]);

  return (
    <motion.article
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        ...transitions.smooth,
        delay: index * 0.05,
      }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100"
    >
      {/* メディア */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {post.media_type === "image" ? (
          <>
            {/* Placeholder blur */}
            <AnimatePresence>
              {!imageLoaded && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 skeleton"
                />
              )}
            </AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={imageLoaded ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative w-full h-full"
            >
              <Image
                src={post.media_url}
                alt={post.caption || "投稿画像"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 512px"
                onLoad={() => setImageLoaded(true)}
              />
            </motion.div>
          </>
        ) : (
          <video
            src={post.media_url}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
        )}

        {/* Child badge overlay */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute top-3 left-3"
        >
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border ${childColorClass}`}
          >
            {post.child.name}
          </span>
        </motion.div>
      </div>

      {/* コンテンツ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4"
      >
        {/* ヘッダー */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-600 font-medium">{age}</span>
          <span className="text-gray-300">•</span>
          <span className="text-xs text-gray-400">{formattedDate}</span>
        </div>

        {/* キャプション */}
        {post.caption && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-gray-700 text-sm leading-relaxed mb-4"
          >
            {post.caption}
          </motion.p>
        )}

        {/* アクション */}
        <div className="flex items-center gap-4">
          <HeartButton
            isLiked={hasReacted}
            count={reactionCount}
            onToggle={handleReactionToggle}
            disabled={isLoading}
          />

          <motion.button
            onClick={() => onCommentClick?.(post.id)}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-1.5 p-2 -m-2 rounded-full text-gray-400 hover:text-kairi-500 transition-colors focus-ring"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-sm font-medium">{post.comment_count}</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.article>
  );
}

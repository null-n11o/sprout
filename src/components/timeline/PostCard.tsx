"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getFormattedAge } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import { HeartButton } from "@/components/ui";
import { scaleIn, transitions } from "@/lib/animations";
import { TagBadges, type TaggedMember } from "./TagBadges";

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
  tags?: TaggedMember[];
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

  const badgeGradient = isKairi
    ? "from-kairi-400 to-kairi-500"
    : "from-mare-400 to-mare-500";

  return (
    <motion.article
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        ...transitions.smooth,
        delay: index * 0.06,
      }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="bg-white rounded-3xl shadow-medium overflow-hidden border border-white/50 relative group"
      style={{
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.8) inset",
      }}
    >
      {/* Decorative corner accent */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${badgeGradient} opacity-5 rounded-bl-[100px] pointer-events-none`} />

      {/* メディア */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {post.media_type === "image" ? (
          <>
            {/* Placeholder blur with shimmer */}
            <AnimatePresence>
              {!imageLoaded && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  className="absolute inset-0 skeleton"
                />
              )}
            </AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={imageLoaded ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative w-full h-full"
            >
              <Image
                src={post.media_url}
                alt={post.caption || "投稿画像"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 512px"
                onLoad={() => setImageLoaded(true)}
              />
              {/* Subtle vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
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

        {/* Child badge overlay - more distinctive */}
        <motion.div
          initial={{ opacity: 0, x: -15, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 300 }}
          className="absolute top-4 left-4"
        >
          <span
            className={`px-4 py-2 rounded-2xl text-xs font-bold text-white backdrop-blur-md border border-white/20 shadow-medium bg-gradient-to-r ${badgeGradient}`}
          >
            {post.child.name}
          </span>
        </motion.div>
      </div>

      {/* コンテンツ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-5"
      >
        {/* ヘッダー */}
        <div className="flex items-center gap-2.5 mb-3">
          <span className={`text-sm font-semibold ${isKairi ? "text-kairi-500" : "text-mare-500"}`}>
            {age}
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="text-xs text-gray-400 font-medium">{formattedDate}</span>
        </div>

        {/* キャプション */}
        {post.caption && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 text-sm leading-relaxed mb-4"
          >
            {post.caption}
          </motion.p>
        )}

        {/* タグ */}
        {post.tags && post.tags.length > 0 && (
          <TagBadges tags={post.tags} />
        )}

        {/* アクション - enhanced styling */}
        <div className="flex items-center gap-1 pt-2 mt-3 border-t border-gray-100/80">
          <HeartButton
            isLiked={hasReacted}
            count={reactionCount}
            onToggle={handleReactionToggle}
            disabled={isLoading}
          />

          <motion.button
            onClick={() => onCommentClick?.(post.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-kairi-500 hover:bg-kairi-50/50 transition-all focus-ring"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">{post.comment_count}</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.article>
  );
}

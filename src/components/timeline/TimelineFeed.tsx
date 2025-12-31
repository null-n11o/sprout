"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PostCard, PostWithDetails } from "./PostCard";
import { ChildFilter } from "./ChildFilter";
import { Loader2 } from "lucide-react";

type Child = {
  id: string;
  name: string;
};

type TimelineFeedProps = {
  children: Child[];
};

export function TimelineFeed({ children }: TimelineFeedProps) {
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(
    async (cursor?: string | null) => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (selectedChildId) params.set("child_id", selectedChildId);

      const response = await fetch(`/api/posts?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch posts");

      return response.json();
    },
    [selectedChildId]
  );

  const loadInitialPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPosts();
      setPosts(data.posts);
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPosts]);

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;

    setIsLoadingMore(true);
    try {
      const data = await fetchPosts(nextCursor);
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPosts, nextCursor, hasMore, isLoadingMore]);

  // 初回読み込み & フィルター変更時
  useEffect(() => {
    setPosts([]);
    setNextCursor(null);
    setHasMore(true);
    loadInitialPosts();
  }, [loadInitialPosts]);

  // Intersection Observer で無限スクロール
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, isLoadingMore, loadMorePosts]);

  return (
    <div className="space-y-4">
      {/* フィルター */}
      <ChildFilter
        selectedChildId={selectedChildId}
        onSelect={setSelectedChildId}
        children={children}
      />

      {/* 投稿一覧 */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">まだ投稿がありません</p>
          <p className="text-gray-400 text-sm mt-2">
            下の + ボタンから写真を投稿してみましょう
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {/* 無限スクロールのトリガー */}
          <div ref={loadMoreRef} className="h-4" />

          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

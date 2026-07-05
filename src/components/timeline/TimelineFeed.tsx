"use client";

import { PostCard } from "./PostCard";
import { ChildFilter } from "./ChildFilter";
import { CommentSection } from "./CommentSection";
import { useTimelineFeed } from "./useTimelineFeed";
import { Loader2 } from "lucide-react";

type Child = {
  id: string;
  name: string;
};

type TimelineFeedProps = {
  childList: Child[];
  currentUserId: string;
};

export function TimelineFeed({ childList, currentUserId }: TimelineFeedProps) {
  const {
    posts,
    selectedChildId,
    setSelectedChildId,
    isLoading,
    isLoadingMore,
    loadMoreRef,
    selectedPostId,
    setSelectedPostId,
    handleCommentClick,
    handleCommentCountChange,
  } = useTimelineFeed(currentUserId);

  return (
    <div className="space-y-4">
      {/* フィルター */}
      <ChildFilter
        selectedChildId={selectedChildId}
        onSelect={setSelectedChildId}
        childList={childList}
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
            <PostCard
              key={post.id}
              post={post}
              onCommentClick={handleCommentClick}
            />
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

      {/* コメントセクション */}
      {selectedPostId && (
        <CommentSection
          postId={selectedPostId}
          isOpen={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
          currentUserId={currentUserId}
          onCommentCountChange={handleCommentCountChange}
        />
      )}
    </div>
  );
}

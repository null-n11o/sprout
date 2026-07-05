"use client";

import { X, Send, Loader2, Trash2 } from "lucide-react";
import { useComments } from "./useComments";

type CommentSectionProps = {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onCommentCountChange?: (postId: string, count: number) => void;
};

export function CommentSection({
  postId,
  isOpen,
  onClose,
  currentUserId,
  onCommentCountChange,
}: CommentSectionProps) {
  const {
    comments,
    newComment,
    setNewComment,
    isLoading,
    isSubmitting,
    deletingId,
    inputRef,
    commentsEndRef,
    handleSubmit,
    handleDelete,
  } = useComments({ postId, isOpen, onCommentCountChange });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "たった今";
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;

    return date.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col animate-slide-up">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">コメント</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* コメント一覧 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>まだコメントがありません</p>
              <p className="text-sm mt-1">最初のコメントを投稿しましょう</p>
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-sm font-medium text-gray-600">
                    {comment.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">
                        {comment.user.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.created_at)}
                      </span>
                      {comment.user_id === currentUserId && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                        >
                          {deletingId === comment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-400" />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5 break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </>
          )}
        </div>

        {/* 入力フォーム */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを入力..."
              maxLength={500}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type CommentUser = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: CommentUser;
};

type UseCommentsParams = {
  postId: string;
  isOpen: boolean;
  onCommentCountChange?: (postId: string, count: number) => void;
};

export function useComments({
  postId,
  isOpen,
  onCommentCountChange,
}: UseCommentsParams) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, fetchComments]);

  useEffect(() => {
    if (comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
        onCommentCountChange?.(postId, comments.length + 1);
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (deletingId) return;

    setDeletingId(commentId);
    try {
      const response = await fetch(
        `/api/posts/${postId}/comments/${commentId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        onCommentCountChange?.(postId, comments.length - 1);
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return {
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
  };
}

import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const MAX_COMMENT_LENGTH = 500;

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;
  const { id: postId } = await params;

  const { data: comments, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      user:profiles!inner(id, name, avatar_url)
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Comments fetch error:", error);
    return jsonError("Failed to fetch comments", 500);
  }

  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const { id: postId } = await params;

  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== "string") {
    return jsonError("Content is required", 400);
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    return jsonError("Content cannot be empty", 400);
  }

  if (trimmedContent.length > MAX_COMMENT_LENGTH) {
    return jsonError(`Content must be ${MAX_COMMENT_LENGTH} characters or less`, 400);
  }

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content: trimmedContent,
    })
    .select(
      `
      *,
      user:profiles!inner(id, name, avatar_url)
    `
    )
    .single();

  if (error) {
    console.error("Comment creation error:", error);
    return jsonError("Failed to create comment", 500);
  }

  return NextResponse.json({ comment }, { status: 201 });
}

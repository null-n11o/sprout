import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const MAX_COMMENT_LENGTH = 500;

export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id: postId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }

  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id: postId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    return NextResponse.json(
      { error: "Content cannot be empty" },
      { status: 400 }
    );
  }

  if (trimmedContent.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `Content must be ${MAX_COMMENT_LENGTH} characters or less` },
      { status: 400 }
    );
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
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }

  return NextResponse.json({ comment }, { status: 201 });
}

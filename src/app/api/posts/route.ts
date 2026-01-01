import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const POSTS_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const childId = searchParams.get("child_id");

  let query = supabase
    .from("posts")
    .select(
      `
      *,
      child:children!inner(id, name, birth_date, avatar_url),
      user:profiles!inner(id, name, avatar_url),
      reactions:reactions(count),
      comments:comments(count),
      user_reaction:reactions!left(id, user_id)
    `
    )
    .order("created_at", { ascending: false })
    .limit(POSTS_PER_PAGE);

  if (childId) {
    query = query.eq("child_id", childId);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;

  if (error) {
    console.error("Posts fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }

  const transformedPosts = posts?.map((post) => {
    const { reactions, comments, user_reaction, ...rest } = post as {
      reactions: { count: number }[];
      comments: { count: number }[];
      user_reaction: { id: string; user_id: string }[] | null;
      [key: string]: unknown;
    };
    const hasReacted = user_reaction?.some((r) => r.user_id === user.id) ?? false;
    return {
      ...rest,
      reaction_count: reactions?.[0]?.count ?? 0,
      comment_count: comments?.[0]?.count ?? 0,
      has_reacted: hasReacted,
    };
  });

  const lastPost = posts?.[posts.length - 1];
  const nextCursor =
    posts && posts.length === POSTS_PER_PAGE && lastPost
      ? (lastPost as { created_at: string }).created_at
      : null;

  return NextResponse.json({
    posts: transformedPosts,
    nextCursor,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { child_id, media_url, media_type, caption } = body;

  if (!child_id || !media_url || !media_type) {
    return NextResponse.json(
      { error: "Missing required fields: child_id, media_url, media_type" },
      { status: 400 }
    );
  }

  if (!["image", "video"].includes(media_type)) {
    return NextResponse.json(
      { error: "Invalid media_type. Must be 'image' or 'video'" },
      { status: 400 }
    );
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      child_id: child_id as string,
      user_id: user.id,
      media_url: media_url as string,
      media_type: media_type as "image" | "video",
      caption: (caption || null) as string | null,
    })
    .select()
    .single();

  if (error) {
    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }

  return NextResponse.json({ post }, { status: 201 });
}

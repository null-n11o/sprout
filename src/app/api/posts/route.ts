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
      user_reaction:reactions!left(id, user_id),
      post_tags(
        id,
        member_id,
        created_at,
        family_members!inner(
          id,
          role,
          custom_role_name,
          profiles!inner(
            id,
            name,
            avatar_url
          )
        )
      )
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
    const { reactions, comments, user_reaction, post_tags, ...rest } = post as {
      reactions: { count: number }[];
      comments: { count: number }[];
      user_reaction: { id: string; user_id: string }[] | null;
      post_tags: {
        id: string;
        member_id: string;
        created_at: string;
        family_members: {
          id: string;
          role: string;
          custom_role_name: string | null;
          profiles: {
            id: string;
            name: string;
            avatar_url: string | null;
          };
        };
      }[] | null;
      [key: string]: unknown;
    };
    const hasReacted = user_reaction?.some((r) => r.user_id === user.id) ?? false;

    // タグ情報を整形
    const tags = post_tags?.map((tag) => ({
      id: tag.family_members.id,
      role: tag.family_members.role,
      customRoleName: tag.family_members.custom_role_name,
      profile: {
        id: tag.family_members.profiles.id,
        name: tag.family_members.profiles.name,
        avatarUrl: tag.family_members.profiles.avatar_url,
      },
    })) ?? [];

    return {
      ...rest,
      reaction_count: reactions?.[0]?.count ?? 0,
      comment_count: comments?.[0]?.count ?? 0,
      has_reacted: hasReacted,
      tags,
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

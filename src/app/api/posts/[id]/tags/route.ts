import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/posts/[id]/tags
 * 投稿のタグ付きメンバー一覧を取得
 */
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

  const { data: tags, error } = await supabase
    .from("post_tags")
    .select(`
      id,
      member_id,
      family_members!inner (
        id,
        role,
        custom_role_name,
        profiles!inner (
          name,
          avatar_url
        )
      )
    `)
    .eq("post_id", postId);

  if (error) {
    console.error("Tags fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }

  const members = tags?.map((tag) => {
    const member = tag.family_members as {
      id: string;
      role: string;
      custom_role_name: string | null;
      profiles: { name: string; avatar_url: string | null };
    };
    return {
      id: member.id,
      role: member.role,
      customRoleName: member.custom_role_name,
      profile: {
        name: member.profiles.name,
        avatarUrl: member.profiles.avatar_url,
      },
    };
  }) ?? [];

  return NextResponse.json({ members });
}

/**
 * PUT /api/posts/[id]/tags
 * 投稿のタグを更新（全差し替え）
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id: postId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 投稿の所有者確認
  const { data: post } = await supabase
    .from("posts")
    .select("id, user_id")
    .eq("id", postId)
    .single();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: { memberIds: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { memberIds } = body;
  if (!Array.isArray(memberIds)) {
    return NextResponse.json(
      { error: "memberIds must be an array" },
      { status: 400 }
    );
  }

  // 既存タグを全削除
  const { error: deleteError } = await supabase
    .from("post_tags")
    .delete()
    .eq("post_id", postId);

  if (deleteError) {
    console.error("Tags delete error:", deleteError);
    return NextResponse.json(
      { error: "Failed to update tags" },
      { status: 500 }
    );
  }

  // 新しいタグを挿入
  if (memberIds.length > 0) {
    const inserts = memberIds.map((memberId) => ({
      post_id: postId,
      member_id: memberId,
    }));

    const { error: insertError } = await supabase
      .from("post_tags")
      .insert(inserts);

    if (insertError) {
      console.error("Tags insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to update tags" },
        { status: 500 }
      );
    }
  }

  // 更新後のタグを返す
  const { data: tags, error: fetchError } = await supabase
    .from("post_tags")
    .select(`
      id,
      member_id,
      family_members!inner (
        id,
        role,
        custom_role_name,
        profiles!inner (
          name,
          avatar_url
        )
      )
    `)
    .eq("post_id", postId);

  if (fetchError) {
    return NextResponse.json({ members: [] });
  }

  const members = tags?.map((tag) => {
    const member = tag.family_members as {
      id: string;
      role: string;
      custom_role_name: string | null;
      profiles: { name: string; avatar_url: string | null };
    };
    return {
      id: member.id,
      role: member.role,
      customRoleName: member.custom_role_name,
      profile: {
        name: member.profiles.name,
        avatarUrl: member.profiles.avatar_url,
      },
    };
  }) ?? [];

  return NextResponse.json({ members });
}

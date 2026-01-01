import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

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

  // ユーザーがいいねしているか確認
  const { data: reaction } = await supabase
    .from("reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  // いいね数を取得
  const { count } = await supabase
    .from("reactions")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  return NextResponse.json({
    hasReacted: !!reaction,
    count: count ?? 0,
  });
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

  // 既存のリアクションを確認
  const { data: existingReaction } = await supabase
    .from("reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  if (existingReaction) {
    // いいねを取り消す
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existingReaction.id);

    if (error) {
      console.error("Reaction delete error:", error);
      return NextResponse.json(
        { error: "Failed to remove reaction" },
        { status: 500 }
      );
    }

    // 新しいいいね数を取得
    const { count } = await supabase
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    return NextResponse.json({
      hasReacted: false,
      count: count ?? 0,
    });
  } else {
    // いいねを追加
    const { error } = await supabase.from("reactions").insert({
      post_id: postId,
      user_id: user.id,
    });

    if (error) {
      console.error("Reaction create error:", error);
      return NextResponse.json(
        { error: "Failed to add reaction" },
        { status: 500 }
      );
    }

    // 新しいいいね数を取得
    const { count } = await supabase
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    return NextResponse.json({
      hasReacted: true,
      count: count ?? 0,
    });
  }
}

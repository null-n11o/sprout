import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const { id: postId } = await params;

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
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const { id: postId } = await params;

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
      return jsonError("Failed to remove reaction", 500);
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
      return jsonError("Failed to add reaction", 500);
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

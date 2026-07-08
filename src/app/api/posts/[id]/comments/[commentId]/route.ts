import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";

type RouteParams = {
  params: Promise<{ id: string; commentId: string }>;
};

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const { commentId } = await params;

  // コメントが存在し、ユーザーが所有しているか確認
  const { data: comment } = await supabase
    .from("comments")
    .select("id, user_id")
    .eq("id", commentId)
    .single();

  if (!comment) {
    return jsonError("Comment not found", 404);
  }

  if (comment.user_id !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("Comment delete error:", error);
    return jsonError("Failed to delete comment", 500);
  }

  return NextResponse.json({ success: true });
}

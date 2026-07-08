import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;

  const { id } = await params;

  // UUID バリデーション
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return jsonError("Invalid milestone ID", 400);
  }

  // 存在確認
  const { data: existing, error: fetchError } = await supabase
    .from("growth_milestones")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return jsonError("Milestone not found", 404);
  }

  // 削除
  const { error: deleteError } = await supabase
    .from("growth_milestones")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Milestone deletion error:", deleteError);
    return jsonError("Failed to delete milestone", 500);
  }

  return NextResponse.json({ success: true });
}

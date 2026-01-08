import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // UUID バリデーション
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid milestone ID" }, { status: 400 });
  }

  // 存在確認
  const { data: existing, error: fetchError } = await supabase
    .from("growth_milestones")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  // 削除
  const { error: deleteError } = await supabase
    .from("growth_milestones")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Milestone deletion error:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete milestone" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

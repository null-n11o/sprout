import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("child_id");
  const month = searchParams.get("month"); // YYYY-MM 形式

  let query = supabase
    .from("growth_milestones")
    .select("id, content, child_id, recorded_at, created_at")
    .order("created_at", { ascending: false });

  if (childId) {
    query = query.eq("child_id", childId);
  }

  if (month) {
    // YYYY-MM を YYYY-MM-01 形式に変換
    const recordedAt = `${month}-01`;
    query = query.eq("recorded_at", recordedAt);
  }

  const { data: milestones, error } = await query;

  if (error) {
    console.error("Milestones fetch error:", error);
    return jsonError("Failed to fetch milestones", 500);
  }

  return NextResponse.json({ milestones });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;

  const body = await request.json();
  const { child_id, content, recorded_at } = body;

  // バリデーション
  if (!child_id || !content || !recorded_at) {
    return jsonError(
      "Missing required fields: child_id, content, recorded_at",
      400
    );
  }

  if (typeof content !== "string" || content.trim().length === 0) {
    return jsonError("Content must be a non-empty string", 400);
  }

  // recorded_at を YYYY-MM-01 形式に正規化
  let normalizedRecordedAt = recorded_at;
  if (/^\d{4}-\d{2}$/.test(recorded_at)) {
    normalizedRecordedAt = `${recorded_at}-01`;
  }

  const { data: milestone, error } = await supabase
    .from("growth_milestones")
    .insert({
      child_id: child_id as string,
      content: content.trim() as string,
      recorded_at: normalizedRecordedAt as string,
    })
    .select()
    .single();

  if (error) {
    console.error("Milestone creation error:", error);
    return jsonError("Failed to create milestone", 500);
  }

  return NextResponse.json({ milestone }, { status: 201 });
}

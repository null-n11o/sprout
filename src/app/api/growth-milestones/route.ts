import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 }
    );
  }

  return NextResponse.json({ milestones });
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
  const { child_id, content, recorded_at } = body;

  // バリデーション
  if (!child_id || !content || !recorded_at) {
    return NextResponse.json(
      { error: "Missing required fields: child_id, content, recorded_at" },
      { status: 400 }
    );
  }

  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json(
      { error: "Content must be a non-empty string" },
      { status: 400 }
    );
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
    return NextResponse.json(
      { error: "Failed to create milestone" },
      { status: 500 }
    );
  }

  return NextResponse.json({ milestone }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const HEIGHT_MIN = 30; // cm
const HEIGHT_MAX = 200; // cm
const WEIGHT_MIN = 1; // kg
const WEIGHT_MAX = 100; // kg

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

  let query = supabase
    .from("growth_records")
    .select(
      `
      *,
      child:children!inner(id, name, birth_date)
    `
    )
    .order("recorded_at", { ascending: true });

  if (childId) {
    query = query.eq("child_id", childId);
  }

  const { data: records, error } = await query;

  if (error) {
    console.error("Growth records fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch growth records" },
      { status: 500 }
    );
  }

  return NextResponse.json({ records });
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
  const { child_id, height, weight, memo, recorded_at } = body;

  if (!child_id || height === undefined || weight === undefined || !recorded_at) {
    return NextResponse.json(
      { error: "Missing required fields: child_id, height, weight, recorded_at" },
      { status: 400 }
    );
  }

  // バリデーション
  const heightNum = Number(height);
  const weightNum = Number(weight);

  if (isNaN(heightNum) || heightNum < HEIGHT_MIN || heightNum > HEIGHT_MAX) {
    return NextResponse.json(
      { error: `Height must be between ${HEIGHT_MIN} and ${HEIGHT_MAX} cm` },
      { status: 400 }
    );
  }

  if (isNaN(weightNum) || weightNum < WEIGHT_MIN || weightNum > WEIGHT_MAX) {
    return NextResponse.json(
      { error: `Weight must be between ${WEIGHT_MIN} and ${WEIGHT_MAX} kg` },
      { status: 400 }
    );
  }

  const { data: record, error } = await supabase
    .from("growth_records")
    .insert({
      child_id: child_id as string,
      height: heightNum,
      weight: weightNum,
      memo: (memo || null) as string | null,
      recorded_at: recorded_at as string,
    })
    .select()
    .single();

  if (error) {
    console.error("Growth record creation error:", error);
    return NextResponse.json(
      { error: "Failed to create growth record" },
      { status: 500 }
    );
  }

  return NextResponse.json({ record }, { status: 201 });
}

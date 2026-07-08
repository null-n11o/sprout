import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";

const HEIGHT_MIN = 30; // cm
const HEIGHT_MAX = 200; // cm
const WEIGHT_MIN = 1; // kg
const WEIGHT_MAX = 100; // kg

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;

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
    return jsonError("Failed to fetch growth records", 500);
  }

  return NextResponse.json({ records });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;

  const body = await request.json();
  const { child_id, height, weight, memo, recorded_at } = body;

  if (!child_id || height === undefined || weight === undefined || !recorded_at) {
    return jsonError(
      "Missing required fields: child_id, height, weight, recorded_at",
      400
    );
  }

  // バリデーション
  const heightNum = Number(height);
  const weightNum = Number(weight);

  if (isNaN(heightNum) || heightNum < HEIGHT_MIN || heightNum > HEIGHT_MAX) {
    return jsonError(
      `Height must be between ${HEIGHT_MIN} and ${HEIGHT_MAX} cm`,
      400
    );
  }

  if (isNaN(weightNum) || weightNum < WEIGHT_MIN || weightNum > WEIGHT_MAX) {
    return jsonError(
      `Weight must be between ${WEIGHT_MIN} and ${WEIGHT_MAX} kg`,
      400
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
    return jsonError("Failed to create growth record", 500);
  }

  return NextResponse.json({ record }, { status: 201 });
}

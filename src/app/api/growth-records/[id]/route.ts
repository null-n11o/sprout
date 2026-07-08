import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";

const HEIGHT_MIN = 30;
const HEIGHT_MAX = 200;
const WEIGHT_MIN = 1;
const WEIGHT_MAX = 100;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;
  const { id } = await params;

  const { data: record, error } = await supabase
    .from("growth_records")
    .select(
      `
      *,
      child:children!inner(id, name, birth_date)
    `
    )
    .eq("id", id)
    .single();

  if (error || !record) {
    return jsonError("Growth record not found", 404);
  }

  return NextResponse.json({ record });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const { height, weight, memo, recorded_at } = body;

  const updateData: Record<string, unknown> = {};

  if (height !== undefined) {
    const heightNum = Number(height);
    if (isNaN(heightNum) || heightNum < HEIGHT_MIN || heightNum > HEIGHT_MAX) {
      return jsonError(
        `Height must be between ${HEIGHT_MIN} and ${HEIGHT_MAX} cm`,
        400
      );
    }
    updateData.height = heightNum;
  }

  if (weight !== undefined) {
    const weightNum = Number(weight);
    if (isNaN(weightNum) || weightNum < WEIGHT_MIN || weightNum > WEIGHT_MAX) {
      return jsonError(
        `Weight must be between ${WEIGHT_MIN} and ${WEIGHT_MAX} kg`,
        400
      );
    }
    updateData.weight = weightNum;
  }

  if (memo !== undefined) {
    updateData.memo = memo || null;
  }

  if (recorded_at !== undefined) {
    updateData.recorded_at = recorded_at;
  }

  if (Object.keys(updateData).length === 0) {
    return jsonError("No fields to update", 400);
  }

  const { data: record, error } = await supabase
    .from("growth_records")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Growth record update error:", error);
    return jsonError("Failed to update growth record", 500);
  }

  return NextResponse.json({ record });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;
  const { id } = await params;

  const { error } = await supabase
    .from("growth_records")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Growth record deletion error:", error);
    return jsonError("Failed to delete growth record", 500);
  }

  return NextResponse.json({ success: true });
}

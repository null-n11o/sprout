import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;

  const { data: child, error } = await supabase
    .from("children")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return jsonError("Child not found", 404);
    }
    console.error("Child fetch error:", error);
    return jsonError("Failed to fetch child", 500);
  }

  return NextResponse.json({ child });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;

  const body = await request.json();
  const { name, birth_date, gender, avatar_url } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return jsonError("Name is required", 400);
  }

  if (!birth_date) {
    return jsonError("Birth date is required", 400);
  }

  const { data: child, error } = await supabase
    .from("children")
    .update({
      name: name.trim(),
      birth_date,
      gender: gender || null,
      avatar_url: avatar_url || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return jsonError("Child not found", 404);
    }
    console.error("Child update error:", error);
    return jsonError("Failed to update child", 500);
  }

  return NextResponse.json({ child });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;

  // Check if there are associated posts
  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("child_id", id);

  if (postCount && postCount > 0) {
    return jsonError(
      "Cannot delete child with existing posts. Please delete posts first.",
      400
    );
  }

  // Check if there are associated growth records
  const { count: growthCount } = await supabase
    .from("growth_records")
    .select("*", { count: "exact", head: true })
    .eq("child_id", id);

  if (growthCount && growthCount > 0) {
    return jsonError(
      "Cannot delete child with existing growth records. Please delete records first.",
      400
    );
  }

  const { error } = await supabase.from("children").delete().eq("id", id);

  if (error) {
    console.error("Child delete error:", error);
    return jsonError("Failed to delete child", 500);
  }

  return NextResponse.json({ success: true });
}

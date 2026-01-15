import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: child, error } = await supabase
    .from("children")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }
    console.error("Child fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch child" },
      { status: 500 }
    );
  }

  return NextResponse.json({ child });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, birth_date, gender, avatar_url } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!birth_date) {
    return NextResponse.json(
      { error: "Birth date is required" },
      { status: 400 }
    );
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
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }
    console.error("Child update error:", error);
    return NextResponse.json(
      { error: "Failed to update child" },
      { status: 500 }
    );
  }

  return NextResponse.json({ child });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if there are associated posts
  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("child_id", id);

  if (postCount && postCount > 0) {
    return NextResponse.json(
      {
        error: "Cannot delete child with existing posts. Please delete posts first.",
      },
      { status: 400 }
    );
  }

  // Check if there are associated growth records
  const { count: growthCount } = await supabase
    .from("growth_records")
    .select("*", { count: "exact", head: true })
    .eq("child_id", id);

  if (growthCount && growthCount > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot delete child with existing growth records. Please delete records first.",
      },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("children").delete().eq("id", id);

  if (error) {
    console.error("Child delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete child" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Profile fetch error:", error);
    return jsonError("Failed to fetch profile", 500);
  }

  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  const body = await request.json();
  const { name, avatar_url } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return jsonError("Name is required", 400);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      name: name.trim(),
      avatar_url: avatar_url || null,
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Profile update error:", error);
    return jsonError("Failed to update profile", 500);
  }

  return NextResponse.json({ profile });
}

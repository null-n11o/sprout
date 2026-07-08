import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;

  const { data: children, error } = await supabase
    .from("children")
    .select("id, name, birth_date, avatar_url, gender")
    .order("birth_date", { ascending: true });

  if (error) {
    console.error("Children fetch error:", error);
    return jsonError("Failed to fetch children", 500);
  }

  return NextResponse.json({ children });
}

export async function POST(request: NextRequest) {
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
    .insert({
      name: name.trim(),
      birth_date,
      gender: gender || null,
      avatar_url: avatar_url || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Child create error:", error);
    return jsonError("Failed to create child", 500);
  }

  return NextResponse.json({ child }, { status: 201 });
}

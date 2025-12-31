import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: children, error } = await supabase
    .from("children")
    .select("id, name, birth_date, avatar_url")
    .order("birth_date", { ascending: true });

  if (error) {
    console.error("Children fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 }
    );
  }

  return NextResponse.json({ children });
}

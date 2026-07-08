import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export type AuthResult =
  | { supabase: ServerSupabase; user: User; response: null }
  | { supabase: null; user: null; response: NextResponse };

/**
 * 認証チェック。response が非null なら未認証なので、
 * 呼び出し側はそのまま return response する。
 */
export async function requireUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase: null, user: null, response: jsonError("Unauthorized", 401) };
  }

  return { supabase, user, response: null };
}

import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

// 許可するメールアドレスのリスト
const ALLOWED_EMAILS = [
  "your-email@gmail.com", // TODO: 実際のメールアドレスに変更
  "kcp.is.revolutionary@gmail.com"
];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email && ALLOWED_EMAILS.includes(user.email)) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // 許可されていないメールアドレス → サインアウトして拒否
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=unauthorized`);
    }
  }

  // Return to login page with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

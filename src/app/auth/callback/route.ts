import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { validateInvitationResult, type Invitation } from "@/lib/api/invitations";

// 許可するメールアドレスのリスト
const ALLOWED_EMAILS = [
  "your-email@gmail.com", // TODO: 実際のメールアドレスに変更
  "kcp.is.revolutionary@gmail.com",
  "aoita_n.5@icloud.com",
  "aoitanman.5@gmail.com"
];

/**
 * 招待コードをnextパラメータから抽出する
 * 例: /onboarding/role?code=ABC12345 → ABC12345
 */
function extractInvitationCode(next: string): string | null {
  try {
    // nextはパス形式なので、URLとして解析するためにダミーベースを追加
    const url = new URL(next, "http://dummy");
    return url.searchParams.get("code");
  } catch {
    return null;
  }
}

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

      // 許可されたメールアドレスの場合は直接リダイレクト
      if (user?.email && ALLOWED_EMAILS.includes(user.email)) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // 招待コードがある場合は検証
      const invitationCode = extractInvitationCode(next);
      if (invitationCode) {
        const { data: invitation } = await supabase
          .from("family_invitations")
          .select("*")
          .eq("code", invitationCode)
          .maybeSingle();

        if (invitation) {
          const domainInvitation: Invitation = {
            id: invitation.id,
            code: invitation.code,
            createdBy: invitation.created_by,
            expiresAt: new Date(invitation.expires_at),
            usedCount: invitation.used_count,
            maxUses: invitation.max_uses,
            isActive: invitation.is_active,
          };

          const result = validateInvitationResult(domainInvitation);
          if (result.ok) {
            // 有効な招待コードがある場合は許可
            return NextResponse.redirect(`${origin}${next}`);
          }
        }
      }

      // 許可されていないメールアドレスで招待コードもない → サインアウトして拒否
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=unauthorized`);
    }
  }

  // Return to login page with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

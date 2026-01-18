import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isCodeValid,
  validateInvitationResult,
  type Invitation,
} from "@/lib/api/invitations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // コードフォーマット検証
  if (!isCodeValid(code)) {
    return NextResponse.json(
      {
        valid: false,
        error: { type: "NOT_FOUND", message: "無効な招待コードです" },
      },
      { status: 404 }
    );
  }

  const supabase = await createClient();

  const { data: invitation, error } = await supabase
    .from("family_invitations")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("Invitation fetch error:", error);
    return NextResponse.json(
      { valid: false, error: { type: "NOT_FOUND", message: "エラーが発生しました" } },
      { status: 500 }
    );
  }

  if (!invitation) {
    return NextResponse.json(
      {
        valid: false,
        error: { type: "NOT_FOUND", message: "招待コードが見つかりません" },
      },
      { status: 404 }
    );
  }

  // 招待データをドメインオブジェクトに変換
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

  if (!result.ok) {
    const statusCode = result.error.type === "EXPIRED" ? 410 : 404;
    return NextResponse.json(
      {
        valid: false,
        error: result.error,
      },
      { status: statusCode }
    );
  }

  return NextResponse.json({
    valid: true,
    invitation: {
      code: result.value.code,
      expiresAt: result.value.expiresAt.toISOString(),
    },
  });
}

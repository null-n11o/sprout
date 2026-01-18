import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateInvitationCode,
  calculateExpiryDate,
  generateInvitationLink,
} from "@/lib/api/invitations";

const MAX_RETRY_COUNT = 5;

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // コード重複を避けるためリトライロジック
  let code: string;
  let retryCount = 0;

  while (retryCount < MAX_RETRY_COUNT) {
    code = generateInvitationCode();

    const { data: existing } = await supabase
      .from("family_invitations")
      .select("code")
      .eq("code", code)
      .maybeSingle();

    if (!existing) {
      break;
    }

    retryCount++;
    if (retryCount >= MAX_RETRY_COUNT) {
      console.error("Failed to generate unique invitation code");
      return NextResponse.json(
        { error: "Failed to generate invitation code" },
        { status: 500 }
      );
    }
  }

  const expiresAt = calculateExpiryDate();

  const { data: invitation, error } = await supabase
    .from("family_invitations")
    .insert({
      code: code!,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Invitation insert error:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = generateInvitationLink(invitation.code, baseUrl);

  return NextResponse.json({
    code: invitation.code,
    link,
    expiresAt: invitation.expires_at,
  });
}

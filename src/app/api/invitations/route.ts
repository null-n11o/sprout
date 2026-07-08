import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";
import {
  generateInvitationCode,
  calculateExpiryDate,
  generateInvitationLink,
} from "@/lib/api/invitations";

const MAX_RETRY_COUNT = 5;

export async function POST() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

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
      return jsonError("Failed to generate invitation code", 500);
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
    return jsonError("Failed to create invitation", 500);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000";
  const link = generateInvitationLink(invitation.code, baseUrl);

  return NextResponse.json({
    code: invitation.code,
    link,
    expiresAt: invitation.expires_at,
  });
}

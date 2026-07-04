import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";
import {
  validateFamilyRole,
  toFamilyMemberWithProfile,
  type FamilyRole,
  type FamilyMemberWithProfile,
} from "@/lib/api/family-members";
import {
  validateInvitationResult,
  type Invitation,
} from "@/lib/api/invitations";

/**
 * GET /api/family-members
 * 家族メンバー一覧を取得
 */
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;

  // 家族メンバー一覧を取得（profilesをJOIN）
  const { data: members, error } = await supabase
    .from("family_members")
    .select(`
      id,
      user_id,
      role,
      custom_role_name,
      role_confirmed,
      joined_at,
      profiles!inner (
        name,
        avatar_url
      )
    `)
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("Family members fetch error:", error);
    return jsonError("Failed to fetch family members", 500);
  }

  // ドメインオブジェクトに変換
  const familyMembers: FamilyMemberWithProfile[] = members.map((member) => {
    const profile = member.profiles as { name: string; avatar_url: string | null };
    return toFamilyMemberWithProfile(
      {
        id: member.id,
        user_id: member.user_id,
        role: member.role as FamilyRole,
        custom_role_name: member.custom_role_name,
        role_confirmed: member.role_confirmed,
        joined_at: member.joined_at,
      },
      profile
    );
  });

  return NextResponse.json({ members: familyMembers });
}

/**
 * POST /api/family-members
 * 新規メンバーを登録（招待コード検証、役割設定）
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  // リクエストボディを取得
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const { role, customRoleName, invitationCode } = body;

  // 役割の検証
  const roleResult = validateFamilyRole(role);
  if (!roleResult.ok) {
    return jsonError(roleResult.error.message, 400);
  }

  // 既に登録されているか確認
  const { data: existingMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    return jsonError("既に家族メンバーとして登録されています", 409);
  }

  // 招待コードが指定されている場合は検証
  if (invitationCode) {
    const { data: invitation, error: invError } = await supabase
      .from("family_invitations")
      .select("*")
      .eq("code", invitationCode)
      .maybeSingle();

    if (invError || !invitation) {
      return jsonError("招待コードが見つかりません", 400);
    }

    // 招待を検証
    const domainInvitation: Invitation = {
      id: invitation.id,
      code: invitation.code,
      createdBy: invitation.created_by,
      expiresAt: new Date(invitation.expires_at),
      usedCount: invitation.used_count,
      maxUses: invitation.max_uses,
      isActive: invitation.is_active,
    };

    const invResult = validateInvitationResult(domainInvitation);
    if (!invResult.ok) {
      const statusCode = invResult.error.type === "EXPIRED" ? 410 : 400;
      return jsonError(invResult.error.message, statusCode);
    }

    // 招待の使用回数を更新
    const { error: updateError } = await supabase
      .from("family_invitations")
      .update({ used_count: invitation.used_count + 1 })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Invitation update error:", updateError);
      return jsonError("招待コードの更新に失敗しました", 500);
    }
  }

  // 家族メンバーを登録
  const { data: newMember, error: insertError } = await supabase
    .from("family_members")
    .insert({
      user_id: user.id,
      role: roleResult.value,
      custom_role_name: role === "other" ? customRoleName || null : null,
      role_confirmed: true,
    })
    .select(`
      id,
      user_id,
      role,
      custom_role_name,
      role_confirmed,
      joined_at,
      profiles!inner (
        name,
        avatar_url
      )
    `)
    .single();

  if (insertError) {
    console.error("Family member insert error:", insertError);
    return jsonError("家族メンバーの登録に失敗しました", 500);
  }

  const profile = newMember.profiles as { name: string; avatar_url: string | null };
  const familyMember = toFamilyMemberWithProfile(
    {
      id: newMember.id,
      user_id: newMember.user_id,
      role: newMember.role as FamilyRole,
      custom_role_name: newMember.custom_role_name,
      role_confirmed: newMember.role_confirmed,
      joined_at: newMember.joined_at,
    },
    profile
  );

  return NextResponse.json({ member: familyMember }, { status: 201 });
}

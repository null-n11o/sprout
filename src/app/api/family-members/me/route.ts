import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";
import {
  validateFamilyRole,
  toFamilyMemberWithProfile,
  type FamilyRole,
} from "@/lib/api/family-members";

/**
 * PUT /api/family-members/me
 * 自分の役割を更新
 */
export async function PUT(request: NextRequest) {
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

  const { role, customRoleName } = body;

  // 役割の検証
  const roleResult = validateFamilyRole(role);
  if (!roleResult.ok) {
    return jsonError(roleResult.error.message, 400);
  }

  // 自分の家族メンバーレコードを取得
  const { data: existingMember, error: fetchError } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("Family member fetch error:", fetchError);
    return jsonError("Failed to fetch family member", 500);
  }

  if (!existingMember) {
    return jsonError("家族メンバーとして登録されていません", 404);
  }

  // 役割を更新
  const { data: updatedMember, error: updateError } = await supabase
    .from("family_members")
    .update({
      role: roleResult.value,
      custom_role_name: role === "other" ? customRoleName || null : null,
      role_confirmed: true,
    })
    .eq("user_id", user.id)
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

  if (updateError) {
    console.error("Family member update error:", updateError);
    return jsonError("役割の更新に失敗しました", 500);
  }

  const profile = updatedMember.profiles as { name: string; avatar_url: string | null };
  const familyMember = toFamilyMemberWithProfile(
    {
      id: updatedMember.id,
      user_id: updatedMember.user_id,
      role: updatedMember.role as FamilyRole,
      custom_role_name: updatedMember.custom_role_name,
      role_confirmed: updatedMember.role_confirmed,
      joined_at: updatedMember.joined_at,
    },
    profile
  );

  return NextResponse.json({ member: familyMember });
}

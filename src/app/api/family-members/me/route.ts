import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // リクエストボディを取得
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { role, customRoleName } = body;

  // 役割の検証
  const roleResult = validateFamilyRole(role);
  if (!roleResult.ok) {
    return NextResponse.json(
      { error: roleResult.error.message },
      { status: 400 }
    );
  }

  // 自分の家族メンバーレコードを取得
  const { data: existingMember, error: fetchError } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("Family member fetch error:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch family member" },
      { status: 500 }
    );
  }

  if (!existingMember) {
    return NextResponse.json(
      { error: "家族メンバーとして登録されていません" },
      { status: 404 }
    );
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
    return NextResponse.json(
      { error: "役割の更新に失敗しました" },
      { status: 500 }
    );
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

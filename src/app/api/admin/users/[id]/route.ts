import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/admin";
import { jsonError } from "@/lib/api/route-helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ユーザー詳細取得
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSuperAdmin(user.email)) {
    return jsonError("Forbidden", 403);
  }

  try {
    const adminClient = createAdminClient();

    const {
      data: { user: targetUser },
      error,
    } = await adminClient.auth.admin.getUserById(id);

    if (error || !targetUser) {
      return jsonError("User not found", 404);
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    return NextResponse.json({
      id: targetUser.id,
      email: targetUser.email,
      name: profile?.name || targetUser.user_metadata?.name || "Unknown",
      avatarUrl: profile?.avatar_url || targetUser.user_metadata?.avatar_url,
      role: profile?.role || "editor",
      birthDate: profile?.birth_date,
      gender: profile?.gender,
      createdAt: targetUser.created_at,
      lastSignInAt: targetUser.last_sign_in_at,
      provider: targetUser.app_metadata?.provider || "email",
    });
  } catch (error) {
    console.error("Get user error:", error);
    return jsonError("Internal server error", 500);
  }
}

// ユーザー編集
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSuperAdmin(user.email)) {
    return jsonError("Forbidden", 403);
  }

  // 自分自身は削除できないようにする（編集は可能）
  // if (user.id === id) {
  //   return NextResponse.json({ error: "Cannot modify yourself" }, { status: 400 });
  // }

  try {
    const body = await request.json();
    const { name, role, birthDate, gender } = body;

    const adminClient = createAdminClient();

    // プロファイル更新
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (birthDate !== undefined) updateData.birth_date = birthDate;
    if (gender !== undefined) updateData.gender = gender;

    if (Object.keys(updateData).length > 0) {
      const { error } = await adminClient
        .from("profiles")
        .update(updateData)
        .eq("id", id);

      if (error) {
        console.error("Profile update error:", error);
        return jsonError("Failed to update user", 500);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update user error:", error);
    return jsonError("Internal server error", 500);
  }
}

// ユーザー削除
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSuperAdmin(user.email)) {
    return jsonError("Forbidden", 403);
  }

  // 自分自身は削除できない
  if (user.id === id) {
    return jsonError("Cannot delete yourself", 400);
  }

  try {
    const adminClient = createAdminClient();

    // auth.usersから削除（profilesはCASCADE DELETEで自動削除）
    const { error } = await adminClient.auth.admin.deleteUser(id);

    if (error) {
      console.error("Delete user error:", error);
      return jsonError("Failed to delete user", 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return jsonError("Internal server error", 500);
  }
}

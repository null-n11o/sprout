import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/admin";

export async function GET() {
  // 現在のユーザーを確認
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // スーパー管理者かどうか確認
  if (!isSuperAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const adminClient = createAdminClient();

    // auth.usersから全ユーザーを取得
    const {
      data: { users },
      error: authError,
    } = await adminClient.auth.admin.listUsers();

    if (authError) {
      console.error("Failed to list users:", authError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // profilesテーブルから追加情報を取得
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("*");

    if (profilesError) {
      console.error("Failed to fetch profiles:", profilesError);
    }

    // プロファイル情報をマップ化
    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    // ユーザー情報とプロファイルを結合
    const combinedUsers = users.map((authUser) => {
      const profile = profileMap.get(authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        name: profile?.name || authUser.user_metadata?.name || "Unknown",
        avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
        role: profile?.role || "editor",
        birthDate: profile?.birth_date,
        gender: profile?.gender,
        createdAt: authUser.created_at,
        lastSignInAt: authUser.last_sign_in_at,
        provider: authUser.app_metadata?.provider || "email",
      };
    });

    return NextResponse.json({
      users: combinedUsers,
      total: combinedUsers.length,
    });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

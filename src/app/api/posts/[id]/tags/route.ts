import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";
import {
  validateMemberIds,
  toTaggedMember,
  type TaggedMember,
} from "@/lib/api/post-tags";
import type { FamilyRole } from "@/lib/api/family-members";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/posts/[id]/tags
 * 投稿のタグ一覧を取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;
  const { id: postId } = await params;

  // 投稿の存在確認
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .maybeSingle();

  if (postError || !post) {
    return jsonError("投稿が見つかりません", 404);
  }

  // タグを取得（family_membersとprofilesをJOIN）
  const { data: tags, error: tagsError } = await supabase
    .from("post_tags")
    .select(
      `
      id,
      member_id,
      created_at,
      family_members!inner (
        id,
        role,
        custom_role_name,
        profiles!inner (
          id,
          name,
          avatar_url
        )
      )
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (tagsError) {
    console.error("Tags fetch error:", tagsError);
    return jsonError("タグの取得に失敗しました", 500);
  }

  // ドメインオブジェクトに変換
  const taggedMembers: TaggedMember[] = tags.map((tag) => {
    const member = tag.family_members as {
      id: string;
      role: FamilyRole;
      custom_role_name: string | null;
      profiles: {
        id: string;
        name: string;
        avatar_url: string | null;
      };
    };
    return toTaggedMember(
      {
        id: tag.id,
        member_id: tag.member_id,
        created_at: tag.created_at,
      },
      member
    );
  });

  return NextResponse.json({ tags: taggedMembers });
}

/**
 * PUT /api/posts/[id]/tags
 * 投稿のタグを設定・更新（既存タグを全て置き換え）
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const { id: postId } = await params;

  // リクエストボディを取得
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const { memberIds } = body;

  // memberIdsの検証
  const validationResult = validateMemberIds(memberIds);
  if (!validationResult.ok) {
    return jsonError(validationResult.error.message, 400);
  }

  // 投稿の存在と所有者確認
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, user_id")
    .eq("id", postId)
    .maybeSingle();

  if (postError || !post) {
    return jsonError("投稿が見つかりません", 404);
  }

  // 投稿者のみ編集可能
  if (post.user_id !== user.id) {
    return jsonError("この投稿のタグを編集する権限がありません", 403);
  }

  const validMemberIds = validationResult.value;

  // メンバーIDが指定されている場合、存在確認
  if (validMemberIds.length > 0) {
    const { data: existingMembers, error: membersError } = await supabase
      .from("family_members")
      .select("id")
      .in("id", validMemberIds);

    if (membersError) {
      console.error("Members check error:", membersError);
      return jsonError("メンバーの確認に失敗しました", 500);
    }

    if (!existingMembers || existingMembers.length !== validMemberIds.length) {
      return jsonError("指定されたメンバーが見つかりません", 400);
    }
  }

  // 既存タグを削除
  const { error: deleteError } = await supabase
    .from("post_tags")
    .delete()
    .eq("post_id", postId);

  if (deleteError) {
    console.error("Tags delete error:", deleteError);
    return jsonError("タグの削除に失敗しました", 500);
  }

  // 新しいタグを挿入（空配列の場合はスキップ）
  if (validMemberIds.length > 0) {
    const tagsToInsert = validMemberIds.map((memberId) => ({
      post_id: postId,
      member_id: memberId,
    }));

    const { error: insertError } = await supabase
      .from("post_tags")
      .insert(tagsToInsert);

    if (insertError) {
      console.error("Tags insert error:", insertError);
      return jsonError("タグの設定に失敗しました", 500);
    }
  }

  // 更新後のタグを取得して返却
  const { data: tags, error: tagsError } = await supabase
    .from("post_tags")
    .select(
      `
      id,
      member_id,
      created_at,
      family_members!inner (
        id,
        role,
        custom_role_name,
        profiles!inner (
          id,
          name,
          avatar_url
        )
      )
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (tagsError) {
    console.error("Tags fetch error:", tagsError);
    return jsonError("タグの取得に失敗しました", 500);
  }

  // ドメインオブジェクトに変換
  const taggedMembers: TaggedMember[] = tags.map((tag) => {
    const member = tag.family_members as {
      id: string;
      role: FamilyRole;
      custom_role_name: string | null;
      profiles: {
        id: string;
        name: string;
        avatar_url: string | null;
      };
    };
    return toTaggedMember(
      {
        id: tag.id,
        member_id: tag.member_id,
        created_at: tag.created_at,
      },
      member
    );
  });

  return NextResponse.json({ tags: taggedMembers });
}

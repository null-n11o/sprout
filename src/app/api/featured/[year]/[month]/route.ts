import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{
    year: string;
    month: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year, month } = await params;
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("child_id");

  // 年月のバリデーション
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  if (
    isNaN(yearNum) ||
    isNaN(monthNum) ||
    monthNum < 1 ||
    monthNum > 12 ||
    yearNum < 2000 ||
    yearNum > 2100
  ) {
    return NextResponse.json(
      { error: "Invalid year or month" },
      { status: 400 }
    );
  }

  // 月の開始日と終了日を計算
  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();

  try {
    // Like数が最も多い画像を取得するクエリ
    // まず投稿を取得し、リアクション数でソート
    let query = supabase
      .from("posts")
      .select(
        `
        id,
        media_url,
        created_at,
        child:children!inner(id, name)
      `
      )
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)
      .eq("media_type", "image");

    if (childId) {
      query = query.eq("child_id", childId);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      console.error("Posts fetch error:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ featured: null });
    }

    // 各投稿のリアクション数を取得
    const postsWithReactions = await Promise.all(
      posts.map(async (post) => {
        const { count } = await supabase
          .from("reactions")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        return {
          ...post,
          reactionCount: count ?? 0,
        };
      })
    );

    // リアクション数でソート（多い順）、同数なら新しい順
    postsWithReactions.sort((a, b) => {
      if (b.reactionCount !== a.reactionCount) {
        return b.reactionCount - a.reactionCount;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    const featured = postsWithReactions[0];
    const child = featured.child as { id: string; name: string };

    return NextResponse.json({
      featured: {
        id: featured.id,
        mediaUrl: featured.media_url,
        childId: child.id,
        childName: child.name,
        createdAt: featured.created_at,
        reactionCount: featured.reactionCount,
      },
    });
  } catch (error) {
    console.error("Featured image fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured image" },
      { status: 500 }
    );
  }
}

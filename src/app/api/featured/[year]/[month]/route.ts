import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { selectFeaturedPost, toFeaturedResponse } from "@/lib/api/featured";
import { validateYearMonth, calculateMonthRange } from "@/lib/api/date-utils";

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

  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  if (!validateYearMonth(yearNum, monthNum)) {
    return NextResponse.json(
      { error: "Invalid year or month" },
      { status: 400 }
    );
  }

  const { startDate: startDateStr, endDate: endDateStr } = calculateMonthRange(yearNum, monthNum);

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
      return NextResponse.json(
        { featured: null },
        {
          headers: {
            "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
          },
        }
      );
    }

    // 各投稿のリアクション数を取得
    const postsWithReactions = await Promise.all(
      posts.map(async (post) => {
        const { count } = await supabase
          .from("reactions")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        const child = post.child as { id: string; name: string };
        return {
          id: post.id,
          media_url: post.media_url,
          created_at: post.created_at,
          child,
          reactionCount: count ?? 0,
        };
      })
    );

    // lib関数で代表画像を選出
    const featured = selectFeaturedPost(postsWithReactions);
    if (!featured) {
      return NextResponse.json({ featured: null });
    }

    // キャッシュヘッダーを設定（60秒間キャッシュ、stale-while-revalidate）
    return NextResponse.json(
      { featured: toFeaturedResponse(featured) },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Featured image fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured image" },
      { status: 500 }
    );
  }
}

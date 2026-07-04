import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api/route-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("child_id");

  try {
    // 画像が存在する年の一覧を取得
    let postsQuery = supabase
      .from("posts")
      .select("id, media_url, created_at")
      .eq("media_type", "image");

    if (childId) {
      postsQuery = postsQuery.eq("child_id", childId);
    }

    const { data: posts, error: postsError } = await postsQuery;

    if (postsError) {
      console.error("Posts fetch error:", postsError);
      return jsonError("Failed to fetch posts", 500);
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json(
        { years: [] },
        {
          headers: {
            "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
          },
        }
      );
    }

    // 年ごとにグループ化
    const yearMap = new Map<
      number,
      { posts: typeof posts; photoCount: number }
    >();

    for (const post of posts) {
      const year = new Date(post.created_at).getFullYear();
      if (!yearMap.has(year)) {
        yearMap.set(year, { posts: [], photoCount: 0 });
      }
      const yearData = yearMap.get(year)!;
      yearData.posts.push(post);
      yearData.photoCount++;
    }

    // 各年の代表サムネイル（年内で最もLike数が多い画像）を取得
    const yearsWithThumbnails = await Promise.all(
      Array.from(yearMap.entries()).map(async ([year, data]) => {
        // 各投稿のリアクション数を取得
        const postsWithReactions = await Promise.all(
          data.posts.map(async (post) => {
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

        const thumbnail = postsWithReactions[0];

        return {
          year,
          thumbnailUrl: thumbnail?.media_url ?? null,
          photoCount: data.photoCount,
        };
      })
    );

    // 年の降順でソート
    yearsWithThumbnails.sort((a, b) => b.year - a.year);

    // キャッシュヘッダーを設定（5分間キャッシュ、stale-while-revalidate）
    return NextResponse.json(
      { years: yearsWithThumbnails },
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Years fetch error:", error);
    return jsonError("Failed to fetch years", 500);
  }
}

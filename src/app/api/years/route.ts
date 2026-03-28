import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groupPostsByYear, selectYearThumbnails } from "@/lib/api/years";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: 500 }
      );
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

    // lib関数で年ごとにグループ化
    const yearMap = groupPostsByYear(posts);

    // lib関数で各年の代表サムネイルを選出
    const yearsWithThumbnails = await selectYearThumbnails(
      yearMap,
      async (postId) => {
        const { count } = await supabase
          .from("reactions")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId);
        return count ?? 0;
      }
    );

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
    return NextResponse.json(
      { error: "Failed to fetch years" },
      { status: 500 }
    );
  }
}

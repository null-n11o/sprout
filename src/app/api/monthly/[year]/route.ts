import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{
    year: string;
  }>;
};

/**
 * GET /api/monthly/{year}
 *
 * 指定した年の各月に写真が存在するかを返す
 * Response: { availableMonths: number[] }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year } = await params;
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("child_id");

  // 年のバリデーション
  const yearNum = parseInt(year, 10);

  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  // 年の開始日と終了日を計算
  const startDate = new Date(yearNum, 0, 1);
  const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();

  try {
    // その年の写真を取得
    let postsQuery = supabase
      .from("posts")
      .select("created_at")
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)
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

    // 各月に写真があるかを計算
    const monthSet = new Set<number>();

    if (posts) {
      for (const post of posts) {
        const month = new Date(post.created_at).getMonth() + 1;
        monthSet.add(month);
      }
    }

    // ソートして配列に変換
    const availableMonths = Array.from(monthSet).sort((a, b) => a - b);

    return NextResponse.json({ availableMonths });
  } catch (error) {
    console.error("Monthly availability fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly availability" },
      { status: 500 }
    );
  }
}

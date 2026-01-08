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

  // recorded_at 用の月を表す日付（YYYY-MM-01）
  const recordedAtMonth = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;

  try {
    // 写真を取得（posts テーブルから）
    let postsQuery = supabase
      .from("posts")
      .select(
        `
        id,
        media_url,
        media_type,
        created_at,
        child:children!inner(id, name)
      `
      )
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)
      .eq("media_type", "image")
      .order("created_at", { ascending: false })
      .limit(10);

    if (childId) {
      postsQuery = postsQuery.eq("child_id", childId);
    }

    const { data: photos, error: photosError } = await postsQuery;

    if (photosError) {
      console.error("Photos fetch error:", photosError);
      return NextResponse.json(
        { error: "Failed to fetch photos" },
        { status: 500 }
      );
    }

    // 成長記録を取得（最新の1件）
    // DATE型なので gte/lte で日付範囲比較
    const monthStart = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const monthEnd = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    let growthQuery = supabase
      .from("growth_records")
      .select("height, weight, recorded_at")
      .gte("recorded_at", monthStart)
      .lte("recorded_at", monthEnd)
      .order("recorded_at", { ascending: false })
      .limit(1);

    if (childId) {
      growthQuery = growthQuery.eq("child_id", childId);
    }

    const { data: growthRecords, error: growthError } = await growthQuery;

    if (growthError) {
      console.error("Growth records fetch error:", growthError);
      return NextResponse.json(
        { error: "Failed to fetch growth records" },
        { status: 500 }
      );
    }

    // 成長メモを取得
    let milestonesQuery = supabase
      .from("growth_milestones")
      .select("id, content, child_id")
      .eq("recorded_at", recordedAtMonth)
      .order("created_at", { ascending: false });

    if (childId) {
      milestonesQuery = milestonesQuery.eq("child_id", childId);
    }

    const { data: milestones, error: milestonesError } = await milestonesQuery;

    if (milestonesError) {
      console.error("Milestones fetch error:", milestonesError);
      return NextResponse.json(
        { error: "Failed to fetch milestones" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      photos: photos || [],
      growthRecord: growthRecords?.[0] || null,
      milestones: milestones || [],
    });
  } catch (error) {
    console.error("Monthly data fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly data" },
      { status: 500 }
    );
  }
}

export interface PostForYears {
  id: string;
  media_url: string;
  created_at: string;
}

export interface YearData {
  posts: PostForYears[];
  photoCount: number;
}

export interface YearWithThumbnail {
  year: number;
  thumbnailUrl: string | null;
  photoCount: number;
}

/**
 * 投稿を年ごとにグループ化する
 */
export function groupPostsByYear(
  posts: PostForYears[]
): Map<number, YearData> {
  const yearMap = new Map<number, YearData>();

  for (const post of posts) {
    const year = new Date(post.created_at).getFullYear();
    if (!yearMap.has(year)) {
      yearMap.set(year, { posts: [], photoCount: 0 });
    }
    const yearData = yearMap.get(year)!;
    yearData.posts.push(post);
    yearData.photoCount++;
  }

  return yearMap;
}

/**
 * 年ごとの代表サムネイルを選出する
 * 各年内で最もリアクション数が多い画像を選出
 */
export async function selectYearThumbnails(
  yearMap: Map<number, YearData>,
  getReactionCount: (postId: string) => Promise<number>
): Promise<YearWithThumbnail[]> {
  const entries = Array.from(yearMap.entries());

  const yearsWithThumbnails = await Promise.all(
    entries.map(async ([year, data]) => {
      // 各投稿のリアクション数を取得
      const postsWithReactions = await Promise.all(
        data.posts.map(async (post) => ({
          ...post,
          reactionCount: await getReactionCount(post.id),
        }))
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

  return yearsWithThumbnails;
}

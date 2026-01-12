export interface PostWithReactions {
  id: string;
  media_url: string;
  created_at: string;
  child: {
    id: string;
    name: string;
  };
  reactionCount: number;
}

export interface FeaturedPost {
  id: string;
  mediaUrl: string;
  childId: string;
  childName: string;
  createdAt: string;
  reactionCount: number;
}

/**
 * 代表画像選出アルゴリズム
 * 優先順位:
 * 1. Like数が最も多い画像
 * 2. 同数の場合は新しい画像を優先
 * 3. Like数が0の場合は最新画像をフォールバック
 */
export function selectFeaturedPost(
  posts: PostWithReactions[]
): PostWithReactions | null {
  if (posts.length === 0) {
    return null;
  }

  // リアクション数でソート（多い順）、同数なら新しい順
  const sorted = [...posts].sort((a, b) => {
    if (b.reactionCount !== a.reactionCount) {
      return b.reactionCount - a.reactionCount;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return sorted[0];
}

/**
 * PostWithReactionsをFeaturedPostに変換
 */
export function toFeaturedResponse(post: PostWithReactions): FeaturedPost {
  return {
    id: post.id,
    mediaUrl: post.media_url,
    childId: post.child.id,
    childName: post.child.name,
    createdAt: post.created_at,
    reactionCount: post.reactionCount,
  };
}

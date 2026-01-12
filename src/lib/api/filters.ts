export interface PostWithChildId {
  id: string;
  media_url: string;
  created_at: string;
  child_id: string;
}

/**
 * 子どもIDで投稿をフィルタリングする
 * childIdがnullまたは空文字の場合はすべての投稿を返す
 */
export function filterPostsByChild<T extends PostWithChildId>(
  posts: T[],
  childId: string | null
): T[] {
  if (!childId || childId === "") {
    return posts;
  }
  return posts.filter((post) => post.child_id === childId);
}

import { describe, it, expect } from "vitest";
import { selectFeaturedPost, type PostWithReactions } from "./featured";

describe("selectFeaturedPost", () => {
  describe("代表画像選出アルゴリズム", () => {
    it("リアクション数が最も多い画像を選出する", () => {
      const posts: PostWithReactions[] = [
        {
          id: "post-1",
          media_url: "https://example.com/1.jpg",
          created_at: "2024-01-15T10:00:00Z",
          child: { id: "child-1", name: "太郎" },
          reactionCount: 5,
        },
        {
          id: "post-2",
          media_url: "https://example.com/2.jpg",
          created_at: "2024-01-20T10:00:00Z",
          child: { id: "child-1", name: "太郎" },
          reactionCount: 10,
        },
        {
          id: "post-3",
          media_url: "https://example.com/3.jpg",
          created_at: "2024-01-25T10:00:00Z",
          child: { id: "child-1", name: "太郎" },
          reactionCount: 3,
        },
      ];

      const result = selectFeaturedPost(posts);

      expect(result?.id).toBe("post-2");
      expect(result?.reactionCount).toBe(10);
    });

    it("リアクション数が同じ場合は新しい画像を優先する", () => {
      const posts: PostWithReactions[] = [
        {
          id: "post-1",
          media_url: "https://example.com/1.jpg",
          created_at: "2024-01-10T10:00:00Z",
          child: { id: "child-1", name: "太郎" },
          reactionCount: 5,
        },
        {
          id: "post-2",
          media_url: "https://example.com/2.jpg",
          created_at: "2024-01-20T10:00:00Z",
          child: { id: "child-1", name: "太郎" },
          reactionCount: 5,
        },
        {
          id: "post-3",
          media_url: "https://example.com/3.jpg",
          created_at: "2024-01-15T10:00:00Z",
          child: { id: "child-1", name: "太郎" },
          reactionCount: 5,
        },
      ];

      const result = selectFeaturedPost(posts);

      expect(result?.id).toBe("post-2");
      expect(result?.created_at).toBe("2024-01-20T10:00:00Z");
    });

    it("リアクションが0の場合は最新画像をフォールバックする", () => {
      const posts: PostWithReactions[] = [
        {
          id: "post-1",
          media_url: "https://example.com/1.jpg",
          created_at: "2024-01-10T10:00:00Z",
          child: { id: "child-1", name: "太郎" },
          reactionCount: 0,
        },
        {
          id: "post-2",
          media_url: "https://example.com/2.jpg",
          created_at: "2024-01-25T10:00:00Z",
          child: { id: "child-1", name: "太郎" },
          reactionCount: 0,
        },
        {
          id: "post-3",
          media_url: "https://example.com/3.jpg",
          created_at: "2024-01-15T10:00:00Z",
          child: { id: "child-1", name: "太郎" },
          reactionCount: 0,
        },
      ];

      const result = selectFeaturedPost(posts);

      expect(result?.id).toBe("post-2");
      expect(result?.created_at).toBe("2024-01-25T10:00:00Z");
    });

    it("投稿が空の場合はnullを返す", () => {
      const posts: PostWithReactions[] = [];

      const result = selectFeaturedPost(posts);

      expect(result).toBeNull();
    });

    it("投稿が1つの場合はその画像を返す", () => {
      const posts: PostWithReactions[] = [
        {
          id: "post-1",
          media_url: "https://example.com/1.jpg",
          created_at: "2024-01-15T10:00:00Z",
          child: { id: "child-1", name: "太郎" },
          reactionCount: 0,
        },
      ];

      const result = selectFeaturedPost(posts);

      expect(result?.id).toBe("post-1");
    });
  });
});

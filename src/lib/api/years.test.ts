import { describe, it, expect } from "vitest";
import {
  groupPostsByYear,
  selectYearThumbnails,
  type PostForYears,
  type YearData,
} from "./years";

describe("groupPostsByYear", () => {
  it("投稿を年ごとにグループ化する", () => {
    const posts: PostForYears[] = [
      { id: "post-1", media_url: "url1", created_at: "2024-01-15T10:00:00Z" },
      { id: "post-2", media_url: "url2", created_at: "2024-03-20T10:00:00Z" },
      { id: "post-3", media_url: "url3", created_at: "2023-05-10T10:00:00Z" },
      { id: "post-4", media_url: "url4", created_at: "2024-12-25T10:00:00Z" },
    ];

    const result = groupPostsByYear(posts);

    expect(result.size).toBe(2);
    expect(result.get(2024)?.posts.length).toBe(3);
    expect(result.get(2024)?.photoCount).toBe(3);
    expect(result.get(2023)?.posts.length).toBe(1);
    expect(result.get(2023)?.photoCount).toBe(1);
  });

  it("空の配列の場合は空のMapを返す", () => {
    const posts: PostForYears[] = [];

    const result = groupPostsByYear(posts);

    expect(result.size).toBe(0);
  });

  it("同じ年の投稿をすべて含める", () => {
    const posts: PostForYears[] = [
      { id: "post-1", media_url: "url1", created_at: "2024-03-15T10:00:00Z" },
      { id: "post-2", media_url: "url2", created_at: "2024-09-20T15:00:00Z" },
    ];

    const result = groupPostsByYear(posts);

    expect(result.size).toBe(1);
    expect(result.get(2024)?.posts.length).toBe(2);
  });
});

describe("selectYearThumbnails", () => {
  it("リアクション数が最も多い画像をサムネイルとして選出する", async () => {
    const yearMap = new Map<number, YearData>();
    yearMap.set(2024, {
      posts: [
        { id: "post-1", media_url: "url1", created_at: "2024-01-15T10:00:00Z" },
        { id: "post-2", media_url: "url2", created_at: "2024-03-20T10:00:00Z" },
      ],
      photoCount: 2,
    });

    const getReactionCount = async (postId: string): Promise<number> => {
      if (postId === "post-1") return 5;
      if (postId === "post-2") return 10;
      return 0;
    };

    const result = await selectYearThumbnails(yearMap, getReactionCount);

    expect(result.length).toBe(1);
    expect(result[0].year).toBe(2024);
    expect(result[0].thumbnailUrl).toBe("url2");
    expect(result[0].photoCount).toBe(2);
  });

  it("リアクション数が同じ場合は新しい画像を優先する", async () => {
    const yearMap = new Map<number, YearData>();
    yearMap.set(2024, {
      posts: [
        { id: "post-1", media_url: "url1", created_at: "2024-01-15T10:00:00Z" },
        { id: "post-2", media_url: "url2", created_at: "2024-03-20T10:00:00Z" },
      ],
      photoCount: 2,
    });

    const getReactionCount = async (): Promise<number> => 5;

    const result = await selectYearThumbnails(yearMap, getReactionCount);

    expect(result[0].thumbnailUrl).toBe("url2");
  });

  it("年の降順でソートする", async () => {
    const yearMap = new Map<number, YearData>();
    yearMap.set(2022, {
      posts: [
        { id: "post-1", media_url: "url1", created_at: "2022-01-15T10:00:00Z" },
      ],
      photoCount: 1,
    });
    yearMap.set(2024, {
      posts: [
        { id: "post-2", media_url: "url2", created_at: "2024-01-15T10:00:00Z" },
      ],
      photoCount: 1,
    });
    yearMap.set(2023, {
      posts: [
        { id: "post-3", media_url: "url3", created_at: "2023-01-15T10:00:00Z" },
      ],
      photoCount: 1,
    });

    const getReactionCount = async (): Promise<number> => 0;

    const result = await selectYearThumbnails(yearMap, getReactionCount);

    expect(result[0].year).toBe(2024);
    expect(result[1].year).toBe(2023);
    expect(result[2].year).toBe(2022);
  });

  it("空のMapの場合は空配列を返す", async () => {
    const yearMap = new Map<number, YearData>();

    const getReactionCount = async (): Promise<number> => 0;

    const result = await selectYearThumbnails(yearMap, getReactionCount);

    expect(result).toEqual([]);
  });
});

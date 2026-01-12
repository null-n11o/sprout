import { describe, it, expect } from "vitest";
import { filterPostsByChild, type PostWithChildId } from "./filters";

describe("filterPostsByChild", () => {
  const posts: PostWithChildId[] = [
    {
      id: "post-1",
      media_url: "url1",
      created_at: "2024-01-15T10:00:00Z",
      child_id: "child-1",
    },
    {
      id: "post-2",
      media_url: "url2",
      created_at: "2024-02-15T10:00:00Z",
      child_id: "child-2",
    },
    {
      id: "post-3",
      media_url: "url3",
      created_at: "2024-03-15T10:00:00Z",
      child_id: "child-1",
    },
    {
      id: "post-4",
      media_url: "url4",
      created_at: "2024-04-15T10:00:00Z",
      child_id: "child-3",
    },
  ];

  it("指定された子どもIDの投稿のみをフィルタリングする", () => {
    const result = filterPostsByChild(posts, "child-1");

    expect(result.length).toBe(2);
    expect(result.every((p) => p.child_id === "child-1")).toBe(true);
  });

  it("存在しない子どもIDの場合は空配列を返す", () => {
    const result = filterPostsByChild(posts, "child-999");

    expect(result.length).toBe(0);
  });

  it("childIdがnullの場合はすべての投稿を返す", () => {
    const result = filterPostsByChild(posts, null);

    expect(result.length).toBe(4);
  });

  it("childIdが空文字の場合はすべての投稿を返す", () => {
    const result = filterPostsByChild(posts, "");

    expect(result.length).toBe(4);
  });

  it("空配列の場合は空配列を返す", () => {
    const result = filterPostsByChild([], "child-1");

    expect(result.length).toBe(0);
  });

  it("特定の子どもIDでフィルタリングした結果の順序を保持する", () => {
    const result = filterPostsByChild(posts, "child-1");

    expect(result[0].id).toBe("post-1");
    expect(result[1].id).toBe("post-3");
  });
});

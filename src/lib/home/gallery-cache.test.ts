import { describe, it, expect } from "vitest";
import { getCacheKey, CACHE_TTL } from "./gallery-cache";

describe("getCacheKey", () => {
  it("年・月・childIdをハイフンで連結したキーを生成する", () => {
    expect(getCacheKey(2024, 3, "child-1")).toBe("2024-3-child-1");
  });

  it("childIdがnullの場合は 'all' を使う", () => {
    expect(getCacheKey(2024, 3, null)).toBe("2024-3-all");
  });

  it("childIdが空文字の場合も 'all' を使う", () => {
    expect(getCacheKey(2024, 12, "")).toBe("2024-12-all");
  });

  it("年・月が異なれば異なるキーになる", () => {
    expect(getCacheKey(2023, 1, "child-1")).not.toBe(
      getCacheKey(2024, 1, "child-1")
    );
    expect(getCacheKey(2024, 1, "child-1")).not.toBe(
      getCacheKey(2024, 2, "child-1")
    );
  });

  it("childIdが異なれば異なるキーになる", () => {
    expect(getCacheKey(2024, 1, "child-1")).not.toBe(
      getCacheKey(2024, 1, "child-2")
    );
  });
});

describe("CACHE_TTL", () => {
  it("60秒（ミリ秒）である", () => {
    expect(CACHE_TTL).toBe(60 * 1000);
  });
});

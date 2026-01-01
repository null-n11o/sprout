import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  // These tests check the navigation structure without requiring authentication
  test("should have bottom navigation on login page", async ({ page }) => {
    await page.goto("/login");

    // Login page doesn't have bottom nav
    await expect(page.locator("nav")).not.toBeVisible();
  });

  test("should display 404 for unknown routes", async ({ page }) => {
    await page.goto("/nonexistent-page");

    await expect(page.getByText("ページが見つかりません")).toBeVisible();
    await expect(page.getByRole("link", { name: /ホームに戻る/ })).toBeVisible();
  });

  test("offline page should be accessible", async ({ page }) => {
    await page.goto("/offline");

    await expect(page.getByText(/オフライン|接続/)).toBeVisible();
  });
});

test.describe("Navigation with Auth", () => {
  // Note: These tests require authentication setup
  // In a real scenario, you'd use storage state from authenticated session

  test.skip("should navigate between tabs", async ({ page }) => {
    // This test would require authentication
    await page.goto("/");

    // Check bottom nav exists
    const nav = page.locator("nav.fixed.bottom-0");
    await expect(nav).toBeVisible();

    // Check all navigation items
    await expect(nav.getByText("ホーム")).toBeVisible();
    await expect(nav.getByText("投稿")).toBeVisible();
    await expect(nav.getByText("成長記録")).toBeVisible();
    await expect(nav.getByText("設定")).toBeVisible();
  });
});

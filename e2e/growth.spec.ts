import { test, expect } from "@playwright/test";

test.describe("Growth Records", () => {
  test.describe("Unauthenticated", () => {
    test("should redirect to login", async ({ page }) => {
      await page.goto("/growth");
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe("Authenticated", () => {
    // Skip tests that require authentication
    test.skip("should display growth page", async ({ page }) => {
      await page.goto("/growth");

      await expect(page.getByRole("heading", { name: "成長記録" })).toBeVisible();
      await expect(page.getByRole("button", { name: "記録する" })).toBeVisible();
    });

    test.skip("should open record form on button click", async ({ page }) => {
      await page.goto("/growth");

      await page.getByRole("button", { name: "記録する" }).click();

      await expect(page.getByRole("heading", { name: "新しい記録" })).toBeVisible();
    });

    test.skip("should display form fields", async ({ page }) => {
      await page.goto("/growth");
      await page.getByRole("button", { name: "記録する" }).click();

      await expect(page.getByPlaceholder(/身長/)).toBeVisible();
      await expect(page.getByPlaceholder(/体重/)).toBeVisible();
    });

    test.skip("should close form on cancel", async ({ page }) => {
      await page.goto("/growth");
      await page.getByRole("button", { name: "記録する" }).click();

      await page.getByRole("button", { name: /キャンセル|閉じる/ }).click();

      await expect(page.getByRole("heading", { name: "新しい記録" })).not.toBeVisible();
    });

    test.skip("should display growth chart when records exist", async ({ page }) => {
      await page.goto("/growth");

      // Check if chart container is visible
      await expect(page.locator(".recharts-wrapper")).toBeVisible();
    });

    test.skip("should validate numeric input for height", async ({ page }) => {
      await page.goto("/growth");
      await page.getByRole("button", { name: "記録する" }).click();

      const heightInput = page.getByPlaceholder(/身長/);
      await heightInput.fill("invalid");

      // Should show validation error or clear invalid input
    });
  });
});

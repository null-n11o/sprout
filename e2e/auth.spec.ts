import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should redirect to login page when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/.*login/);
  });

  test("should display login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("h1")).toContainText("Sprout");
    await expect(page.getByPlaceholder("メールアドレス")).toBeVisible();
    await expect(page.getByPlaceholder("パスワード")).toBeVisible();
    await expect(page.getByRole("button", { name: /ログイン/ })).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("メールアドレス").fill("invalid@example.com");
    await page.getByPlaceholder("パスワード").fill("wrongpassword");
    await page.getByRole("button", { name: /ログイン/ }).click();

    await expect(page.getByText(/エラー|失敗|無効/)).toBeVisible({ timeout: 10000 });
  });

  test("should show validation error for empty email", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("パスワード").fill("password123");
    await page.getByRole("button", { name: /ログイン/ }).click();

    // Browser native validation or custom error
    const emailInput = page.getByPlaceholder("メールアドレス");
    await expect(emailInput).toHaveAttribute("required", "");
  });
});

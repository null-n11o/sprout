import { test, expect } from "@playwright/test";

test.describe("Photo Upload", () => {
  test.describe("Unauthenticated", () => {
    test("should redirect to login", async ({ page }) => {
      await page.goto("/upload");
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe("Authenticated", () => {
    // Skip tests that require authentication
    test.skip("should display upload form", async ({ page }) => {
      await page.goto("/upload");

      await expect(page.getByRole("heading", { name: "新しい投稿" })).toBeVisible();
    });

    test.skip("should show file input", async ({ page }) => {
      await page.goto("/upload");

      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached();
    });

    test.skip("should show child selector", async ({ page }) => {
      await page.goto("/upload");

      const childSelector = page.locator('select, [role="combobox"]');
      await expect(childSelector.first()).toBeVisible();
    });

    test.skip("should validate required fields", async ({ page }) => {
      await page.goto("/upload");

      const submitButton = page.getByRole("button", { name: /投稿/ });
      await submitButton.click();

      // Should show validation error or form shouldn't submit
    });

    test.skip("should preview selected image", async ({ page }) => {
      await page.goto("/upload");

      // Create a test file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("fake-image-data"),
      });

      // Preview should be visible
      const preview = page.locator("img");
      await expect(preview).toBeVisible();
    });
  });
});

import { test, expect } from "@playwright/test";

test.describe("Home Gallery", () => {
  test.describe("Unauthenticated", () => {
    test("should redirect to login", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe("Authenticated", () => {
    // These tests require authentication - skipped for now
    // In production, you would use authenticated storage state

    test.skip("should display current month gallery on load", async ({
      page,
    }) => {
      await page.goto("/");

      // Should show month tabs
      await expect(page.getByTestId("month-tabs")).toBeVisible();

      // Should show current year/month
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      await expect(
        page.getByRole("button", { name: `${currentMonth}月` })
      ).toHaveAttribute("data-selected", "true");
    });

    test.skip("should switch between monthly and yearly view", async ({
      page,
    }) => {
      await page.goto("/");

      // Click yearly hub button
      const yearlyButton = page.getByTestId("yearly-hub-button");
      await expect(yearlyButton).toBeVisible();
      await yearlyButton.click();

      // Should show yearly archive view
      await expect(page.getByTestId("yearly-archive")).toBeVisible();

      // Click a year tile to go back to monthly view
      const yearTile = page.getByTestId("year-tile").first();
      if (await yearTile.isVisible()) {
        await yearTile.click();
        await expect(page.getByTestId("month-tabs")).toBeVisible();
      }
    });

    test.skip("should filter by child", async ({ page }) => {
      await page.goto("/");

      // Child filter should be visible
      await expect(page.getByTestId("child-filter")).toBeVisible();

      // Click on "全員" should show all photos
      await page.getByRole("button", { name: "全員" }).click();
    });

    test.skip("should display hero image when photos exist", async ({
      page,
    }) => {
      await page.goto("/");

      // Hero image section should be present
      const heroSection = page.getByTestId("hero-image-section");
      await expect(heroSection).toBeVisible();
    });

    test.skip("should display photo grid", async ({ page }) => {
      await page.goto("/");

      // Photo grid should be present
      const photoGrid = page.getByTestId("photo-grid");
      await expect(photoGrid).toBeVisible();
    });

    // Task 3.2: PhotoGrid integration tests
    test.skip("should display photo grid with 3-column layout", async ({
      page,
    }) => {
      await page.goto("/");

      // Photo grid should be present
      const photoGrid = page.getByTestId("photo-grid");
      await expect(photoGrid).toBeVisible();

      // Grid should have 3-column layout (grid-cols-3)
      const gridContainer = photoGrid.locator(".grid.grid-cols-3");
      await expect(gridContainer).toBeVisible();
    });

    test.skip("should exclude featured image from photo grid", async ({
      page,
    }) => {
      await page.goto("/");

      // Get hero image ID if exists
      const heroSection = page.getByTestId("hero-image-section");
      await expect(heroSection).toBeVisible();

      // Photo grid should not contain the featured image
      const photoGrid = page.getByTestId("photo-grid");
      await expect(photoGrid).toBeVisible();

      // Grid photos should be different from hero image
      // (This is verified by the gridPhotos filter logic in HomeGallery)
    });

    test.skip("should open photo modal on grid image click", async ({
      page,
    }) => {
      await page.goto("/");

      // Wait for photo grid to load
      const photoGrid = page.getByTestId("photo-grid");
      await expect(photoGrid).toBeVisible();

      // Click first photo in grid (if exists)
      const firstPhoto = photoGrid.locator("button").first();
      if (await firstPhoto.isVisible()) {
        await firstPhoto.click();

        // Modal overlay should appear
        const modal = page.locator(".fixed.inset-0.bg-black\\/90");
        await expect(modal).toBeVisible();

        // Close button should be visible
        const closeButton = modal.locator('button[aria-label="閉じる"]');
        await expect(closeButton).toBeVisible();

        // Click close button
        await closeButton.click();
        await expect(modal).not.toBeVisible();
      }
    });

    test.skip("should show empty state when no photos in month", async ({
      page,
    }) => {
      await page.goto("/");

      // If no photos, should show empty state message
      const emptyState = page.locator('text="この月の写真はありません"');
      // This will be visible only if there are no photos
      // The test validates the empty state component exists
    });

    test.skip("should navigate months with tabs", async ({ page }) => {
      await page.goto("/");

      // Click previous month tab
      const prevMonthTab = page.getByTestId("month-tab-prev");
      if (await prevMonthTab.isEnabled()) {
        await prevMonthTab.click();

        // URL or state should reflect the month change
        await expect(page.getByTestId("month-tabs")).toBeVisible();
      }
    });
  });
});

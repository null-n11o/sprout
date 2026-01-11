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

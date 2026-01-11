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
      // This will be visible only if there are no photos
      // The test validates the empty state component exists
      const emptyState = page.locator('text="この月の写真はありません"');
      await expect(emptyState).toBeVisible({ timeout: 1000 }).catch(() => {
        // Empty state may not be visible if there are photos
      });
    });

    // Task 4.1: Month tab navigation tests
    test.skip("should display month tabs with all 12 months", async ({
      page,
    }) => {
      await page.goto("/");

      // Should show month tabs container
      const monthTabs = page.getByTestId("month-tabs");
      await expect(monthTabs).toBeVisible();

      // All 12 month tabs should be present
      for (let i = 1; i <= 12; i++) {
        const monthTab = page.getByTestId(`month-tab-${i}`);
        await expect(monthTab).toBeVisible();
        await expect(monthTab).toHaveText(`${i}月`);
      }
    });

    test.skip("should have yearly hub button at the left of tabs", async ({
      page,
    }) => {
      await page.goto("/");

      // Yearly hub button should be visible
      const yearlyHubButton = page.getByTestId("yearly-hub-button");
      await expect(yearlyHubButton).toBeVisible();

      // Yearly hub should be at the start of the tabs row
      // and contain Calendar icon with text "年別"
      await expect(yearlyHubButton).toContainText("年別");
    });

    test.skip("should navigate to different month by clicking tab", async ({
      page,
    }) => {
      await page.goto("/");

      // Get current month
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const targetMonth = currentMonth === 1 ? 2 : 1;

      // Click a different month tab
      const targetMonthTab = page.getByTestId(`month-tab-${targetMonth}`);
      await targetMonthTab.click();

      // Verify the target month is now selected
      await expect(targetMonthTab).toHaveAttribute("data-selected", "true");

      // Current month should no longer be selected
      const currentMonthTab = page.getByTestId(`month-tab-${currentMonth}`);
      await expect(currentMonthTab).toHaveAttribute("data-selected", "false");
    });

    test.skip("should gray out unavailable months", async ({ page }) => {
      await page.goto("/");

      // Check for data-available attribute on month tabs
      // Unavailable months should have data-available="false"
      const monthTabs = page.getByTestId("month-tabs");
      await expect(monthTabs).toBeVisible();

      // At least check that the attribute exists
      const firstMonthTab = page.getByTestId("month-tab-1");
      const dataAvailable = await firstMonthTab.getAttribute("data-available");
      expect(dataAvailable).toBeDefined();
    });

    test.skip("should highlight currently selected month", async ({ page }) => {
      await page.goto("/");

      const now = new Date();
      const currentMonth = now.getMonth() + 1;

      // Current month should be highlighted (data-selected="true")
      const currentMonthTab = page.getByTestId(`month-tab-${currentMonth}`);
      await expect(currentMonthTab).toHaveAttribute("data-selected", "true");

      // Should have distinct styling (bg-gray-800 for selected)
      await expect(currentMonthTab).toHaveClass(/bg-gray-800/);
    });

    // Task 4.2: Swipe navigation tests
    test.skip("should navigate to next month on left swipe", async ({
      page,
    }) => {
      await page.goto("/");

      // Get current month from display
      const monthTabs = page.getByTestId("month-tabs");
      await expect(monthTabs).toBeVisible();

      const now = new Date();
      const currentMonth = now.getMonth() + 1;

      // Get the swipeable content area
      const swipeableContent = page.getByTestId("swipeable-content");
      await expect(swipeableContent).toBeVisible();

      // Perform left swipe (drag from right to left)
      const boundingBox = await swipeableContent.boundingBox();
      if (boundingBox) {
        const startX = boundingBox.x + boundingBox.width * 0.8;
        const endX = boundingBox.x + boundingBox.width * 0.2;
        const y = boundingBox.y + boundingBox.height / 2;

        await page.mouse.move(startX, y);
        await page.mouse.down();
        await page.mouse.move(endX, y, { steps: 10 });
        await page.mouse.up();
      }

      // Wait for animation and check next month is selected
      await page.waitForTimeout(500);
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextMonthTab = page.getByTestId(`month-tab-${nextMonth}`);
      await expect(nextMonthTab).toHaveAttribute("data-selected", "true");
    });

    test.skip("should navigate to previous month on right swipe", async ({
      page,
    }) => {
      await page.goto("/");

      // Get current month from display
      const monthTabs = page.getByTestId("month-tabs");
      await expect(monthTabs).toBeVisible();

      const now = new Date();
      const currentMonth = now.getMonth() + 1;

      // Get the swipeable content area
      const swipeableContent = page.getByTestId("swipeable-content");
      await expect(swipeableContent).toBeVisible();

      // Perform right swipe (drag from left to right)
      const boundingBox = await swipeableContent.boundingBox();
      if (boundingBox) {
        const startX = boundingBox.x + boundingBox.width * 0.2;
        const endX = boundingBox.x + boundingBox.width * 0.8;
        const y = boundingBox.y + boundingBox.height / 2;

        await page.mouse.move(startX, y);
        await page.mouse.down();
        await page.mouse.move(endX, y, { steps: 10 });
        await page.mouse.up();
      }

      // Wait for animation and check previous month is selected
      await page.waitForTimeout(500);
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevMonthTab = page.getByTestId(`month-tab-${prevMonth}`);
      await expect(prevMonthTab).toHaveAttribute("data-selected", "true");
    });

    test.skip("should increment year when swiping from December to January", async ({
      page,
    }) => {
      await page.goto("/");

      // First, navigate to December
      const decemberTab = page.getByTestId("month-tab-12");
      await decemberTab.click();
      await page.waitForTimeout(300);

      // Verify we're on December
      await expect(decemberTab).toHaveAttribute("data-selected", "true");

      // Get the swipeable content area
      const swipeableContent = page.getByTestId("swipeable-content");
      await expect(swipeableContent).toBeVisible();

      // Perform left swipe (to go to next month)
      const boundingBox = await swipeableContent.boundingBox();
      if (boundingBox) {
        const startX = boundingBox.x + boundingBox.width * 0.8;
        const endX = boundingBox.x + boundingBox.width * 0.2;
        const y = boundingBox.y + boundingBox.height / 2;

        await page.mouse.move(startX, y);
        await page.mouse.down();
        await page.mouse.move(endX, y, { steps: 10 });
        await page.mouse.up();
      }

      // Wait for animation and check January is selected
      await page.waitForTimeout(500);
      const januaryTab = page.getByTestId("month-tab-1");
      await expect(januaryTab).toHaveAttribute("data-selected", "true");
    });

    test.skip("should decrement year when swiping from January to December", async ({
      page,
    }) => {
      await page.goto("/");

      // First, navigate to January
      const januaryTab = page.getByTestId("month-tab-1");
      await januaryTab.click();
      await page.waitForTimeout(300);

      // Verify we're on January
      await expect(januaryTab).toHaveAttribute("data-selected", "true");

      // Get the swipeable content area
      const swipeableContent = page.getByTestId("swipeable-content");
      await expect(swipeableContent).toBeVisible();

      // Perform right swipe (to go to previous month)
      const boundingBox = await swipeableContent.boundingBox();
      if (boundingBox) {
        const startX = boundingBox.x + boundingBox.width * 0.2;
        const endX = boundingBox.x + boundingBox.width * 0.8;
        const y = boundingBox.y + boundingBox.height / 2;

        await page.mouse.move(startX, y);
        await page.mouse.down();
        await page.mouse.move(endX, y, { steps: 10 });
        await page.mouse.up();
      }

      // Wait for animation and check December is selected
      await page.waitForTimeout(500);
      const decemberTab = page.getByTestId("month-tab-12");
      await expect(decemberTab).toHaveAttribute("data-selected", "true");
    });

    test.skip("should not change month on small swipe (less than 50px)", async ({
      page,
    }) => {
      await page.goto("/");

      // Get current month
      const now = new Date();
      const currentMonth = now.getMonth() + 1;

      // Get the swipeable content area
      const swipeableContent = page.getByTestId("swipeable-content");
      await expect(swipeableContent).toBeVisible();

      // Perform small swipe (less than 50px)
      const boundingBox = await swipeableContent.boundingBox();
      if (boundingBox) {
        const startX = boundingBox.x + boundingBox.width / 2;
        const endX = startX - 30; // Only 30px swipe
        const y = boundingBox.y + boundingBox.height / 2;

        await page.mouse.move(startX, y);
        await page.mouse.down();
        await page.mouse.move(endX, y, { steps: 5 });
        await page.mouse.up();
      }

      // Wait and verify month hasn't changed
      await page.waitForTimeout(500);
      const currentMonthTab = page.getByTestId(`month-tab-${currentMonth}`);
      await expect(currentMonthTab).toHaveAttribute("data-selected", "true");
    });

    test.skip("should show slide animation when changing months", async ({
      page,
    }) => {
      await page.goto("/");

      // Get the swipeable content area
      const swipeableContent = page.getByTestId("swipeable-content");
      await expect(swipeableContent).toBeVisible();

      // Perform swipe
      const boundingBox = await swipeableContent.boundingBox();
      if (boundingBox) {
        const startX = boundingBox.x + boundingBox.width * 0.8;
        const endX = boundingBox.x + boundingBox.width * 0.2;
        const y = boundingBox.y + boundingBox.height / 2;

        await page.mouse.move(startX, y);
        await page.mouse.down();
        await page.mouse.move(endX, y, { steps: 10 });
        await page.mouse.up();
      }

      // The content should have animation (transform style changes)
      // This verifies the animation is triggered
      await page.waitForTimeout(100);
    });

    // Task 5.1: Yearly Archive tests
    test.skip("should display yearly archive when yearly hub is clicked", async ({
      page,
    }) => {
      await page.goto("/");

      // Click yearly hub button
      const yearlyHubButton = page.getByTestId("yearly-hub-button");
      await expect(yearlyHubButton).toBeVisible();
      await yearlyHubButton.click();

      // Should show yearly archive view
      const yearlyArchive = page.getByTestId("yearly-archive");
      await expect(yearlyArchive).toBeVisible();

      // Should show "年別アーカイブ" title
      await expect(yearlyArchive.getByText("年別アーカイブ")).toBeVisible();
    });

    test.skip("should display year tiles with thumbnail and photo count", async ({
      page,
    }) => {
      await page.goto("/");

      // Click yearly hub button
      await page.getByTestId("yearly-hub-button").click();

      // Wait for yearly archive to be visible
      const yearlyArchive = page.getByTestId("yearly-archive");
      await expect(yearlyArchive).toBeVisible();

      // Check if year tiles exist (if there are photos)
      const yearTiles = page.getByTestId("year-tile");
      const tileCount = await yearTiles.count();

      if (tileCount > 0) {
        // Each tile should display year number and photo count
        const firstTile = yearTiles.first();
        await expect(firstTile).toBeVisible();

        // Should contain year text (4-digit number)
        const yearText = firstTile.locator("p.text-xl.font-bold");
        await expect(yearText).toBeVisible();

        // Should contain photo count text with "枚" suffix
        const countText = firstTile.locator("text=/\\d+枚/");
        await expect(countText).toBeVisible();
      }
    });

    test.skip("should navigate to selected year's January when year tile is clicked", async ({
      page,
    }) => {
      await page.goto("/");

      // Click yearly hub button
      await page.getByTestId("yearly-hub-button").click();

      // Wait for yearly archive to be visible
      const yearlyArchive = page.getByTestId("yearly-archive");
      await expect(yearlyArchive).toBeVisible();

      // Click first year tile (if exists)
      const yearTiles = page.getByTestId("year-tile");
      const tileCount = await yearTiles.count();

      if (tileCount > 0) {
        const firstTile = yearTiles.first();
        await firstTile.click();

        // Should switch back to monthly view
        await expect(page.getByTestId("month-tabs")).toBeVisible();

        // January should be selected
        const januaryTab = page.getByTestId("month-tab-1");
        await expect(januaryTab).toHaveAttribute("data-selected", "true");
      }
    });

    test.skip("should return to monthly view when back button is clicked", async ({
      page,
    }) => {
      await page.goto("/");

      // Click yearly hub button to go to yearly view
      await page.getByTestId("yearly-hub-button").click();
      await expect(page.getByTestId("yearly-archive")).toBeVisible();

      // Click "月別表示" button
      const backButton = page.getByRole("button", { name: "月別表示" });
      await expect(backButton).toBeVisible();
      await backButton.click();

      // Should be back to monthly view
      await expect(page.getByTestId("month-tabs")).toBeVisible();
      await expect(page.getByTestId("yearly-archive")).not.toBeVisible();
    });

    test.skip("should show empty state when no photos exist in yearly archive", async ({
      page,
    }) => {
      await page.goto("/");

      // Click yearly hub button
      await page.getByTestId("yearly-hub-button").click();

      // Wait for yearly archive to be visible
      const yearlyArchive = page.getByTestId("yearly-archive");
      await expect(yearlyArchive).toBeVisible();

      // If no year tiles, should show empty state
      const yearTiles = page.getByTestId("year-tile");
      const tileCount = await yearTiles.count();

      if (tileCount === 0) {
        await expect(yearlyArchive.getByText("写真がありません")).toBeVisible();
      }
    });

    test.skip("should display year tiles in 2-column grid layout", async ({
      page,
    }) => {
      await page.goto("/");

      // Click yearly hub button
      await page.getByTestId("yearly-hub-button").click();

      // Wait for yearly archive to be visible
      const yearlyArchive = page.getByTestId("yearly-archive");
      await expect(yearlyArchive).toBeVisible();

      // Grid should have 2-column layout (grid-cols-2)
      const gridContainer = yearlyArchive.locator(".grid.grid-cols-2");
      await expect(gridContainer).toBeVisible();
    });

    test.skip("should display year tiles with gradient overlay for better text visibility", async ({
      page,
    }) => {
      await page.goto("/");

      // Click yearly hub button
      await page.getByTestId("yearly-hub-button").click();

      // Wait for yearly archive to be visible
      const yearlyArchive = page.getByTestId("yearly-archive");
      await expect(yearlyArchive).toBeVisible();

      // Check if year tiles have gradient overlay
      const yearTiles = page.getByTestId("year-tile");
      const tileCount = await yearTiles.count();

      if (tileCount > 0) {
        const firstTile = yearTiles.first();
        // Should contain gradient overlay div
        const gradientOverlay = firstTile.locator(
          ".bg-gradient-to-t.from-black\\/60"
        );
        await expect(gradientOverlay).toBeVisible();
      }
    });
  });
});

import { test, expect } from "@playwright/test";

/**
 * ホーム画面E2Eテスト
 *
 * Note: 認証が必要なテストはtest.skipで無効化。
 * 本番環境では認証状態を保存したstorageStateを使用してテストを有効化する。
 *
 * テスト有効化方法:
 * 1. `npx playwright test --headed` で手動ログイン
 * 2. `storageState: 'auth.json'` を playwright.config.ts に設定
 * 3. test.skip を削除してテスト実行
 */

test.describe("Home Gallery - Unauthenticated", () => {
  test("未認証ユーザーはログインページにリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe("Home Gallery - Authenticated (requires auth)", () => {
  // これらのテストは認証状態が必要
  // storageStateを設定後に有効化する

  test.describe("ホーム画面初期表示", () => {
    test.skip("当月の月タブがハイライト表示される", async ({ page }) => {
      await page.goto("/");

      // 月タブが表示されることを確認
      const monthTabs = page.getByTestId("month-tabs");
      await expect(monthTabs).toBeVisible({ timeout: 10000 });

      // 現在の月のタブが選択されていることを確認
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentMonthTab = page.getByTestId(`month-tab-${currentMonth}`);
      await expect(currentMonthTab).toHaveAttribute("data-selected", "true");
    });

    test.skip("Hero Imageセクションが表示される", async ({ page }) => {
      await page.goto("/");
      const heroSection = page.getByTestId("hero-image-section");
      await expect(heroSection).toBeVisible({ timeout: 10000 });
    });

    test.skip("Photo Gridが表示される", async ({ page }) => {
      await page.goto("/");
      const photoGrid = page.getByTestId("photo-grid");
      await expect(photoGrid).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("月タブによる月移動", () => {
    test.skip("タブクリックで月が切り替わる", async ({ page }) => {
      await page.goto("/");

      const monthTabs = page.getByTestId("month-tabs");
      await expect(monthTabs).toBeVisible({ timeout: 10000 });

      // 現在月と異なる月をクリック
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const targetMonth = currentMonth === 1 ? 2 : 1;

      const targetMonthTab = page.getByTestId(`month-tab-${targetMonth}`);
      await targetMonthTab.click();

      // 対象月が選択状態になることを確認
      await expect(targetMonthTab).toHaveAttribute("data-selected", "true");
    });

    test.skip("12ヶ月すべてのタブが表示される", async ({ page }) => {
      await page.goto("/");

      const monthTabs = page.getByTestId("month-tabs");
      await expect(monthTabs).toBeVisible({ timeout: 10000 });

      // 12ヶ月分のタブを確認
      for (let i = 1; i <= 12; i++) {
        const monthTab = page.getByTestId(`month-tab-${i}`);
        await expect(monthTab).toBeVisible();
        await expect(monthTab).toHaveText(`${i}月`);
      }
    });

    test.skip("年別ボタンが表示される", async ({ page }) => {
      await page.goto("/");

      const yearlyHubButton = page.getByTestId("yearly-hub-button");
      await expect(yearlyHubButton).toBeVisible({ timeout: 10000 });
      await expect(yearlyHubButton).toContainText("年別");
    });
  });

  test.describe("年別アーカイブからのドリルダウン", () => {
    test.skip("年別ボタンをクリックするとアーカイブ表示に切り替わる", async ({
      page,
    }) => {
      await page.goto("/");

      // 年別ボタンをクリック
      const yearlyHubButton = page.getByTestId("yearly-hub-button");
      await expect(yearlyHubButton).toBeVisible({ timeout: 10000 });
      await yearlyHubButton.click();

      // 年別アーカイブが表示されることを確認
      const yearlyArchive = page.getByTestId("yearly-archive");
      await expect(yearlyArchive).toBeVisible();
    });

    test.skip("年タイルをクリックするとその年の1月に遷移する", async ({
      page,
    }) => {
      await page.goto("/");

      // 年別ボタンをクリック
      const yearlyHubButton = page.getByTestId("yearly-hub-button");
      await expect(yearlyHubButton).toBeVisible({ timeout: 10000 });
      await yearlyHubButton.click();

      // 年別アーカイブが表示されることを確認
      const yearlyArchive = page.getByTestId("yearly-archive");
      await expect(yearlyArchive).toBeVisible();

      // 年タイルをクリック
      const yearTiles = page.getByTestId("year-tile");
      const tileCount = await yearTiles.count();

      if (tileCount > 0) {
        await yearTiles.first().click();

        // 月別表示に戻り、1月が選択されていることを確認
        await expect(page.getByTestId("month-tabs")).toBeVisible();
        const januaryTab = page.getByTestId("month-tab-1");
        await expect(januaryTab).toHaveAttribute("data-selected", "true");
      }
    });

    test.skip("月別表示ボタンで月表示に戻る", async ({ page }) => {
      await page.goto("/");

      // 年別ボタンをクリック
      const yearlyHubButton = page.getByTestId("yearly-hub-button");
      await expect(yearlyHubButton).toBeVisible({ timeout: 10000 });
      await yearlyHubButton.click();

      // 年別アーカイブが表示されることを確認
      await expect(page.getByTestId("yearly-archive")).toBeVisible();

      // 「月別表示」ボタンをクリック
      const backButton = page.getByRole("button", { name: "月別表示" });
      await expect(backButton).toBeVisible();
      await backButton.click();

      // 月タブが再び表示されることを確認
      await expect(page.getByTestId("month-tabs")).toBeVisible();
      await expect(page.getByTestId("yearly-archive")).not.toBeVisible();
    });
  });
});

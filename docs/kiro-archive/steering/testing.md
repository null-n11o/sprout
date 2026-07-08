# テスト仕様

## 概要

本プロジェクトでは3層のテスト戦略を採用している。

## テストツール

| 種別 | ツール | 設定ファイル | コマンド |
|------|--------|--------------|----------|
| 単体テスト | Vitest | `vitest.config.ts` | `npm run test` |
| 監視モード | Vitest | - | `npm run test:watch` |
| E2Eテスト | Playwright | `playwright.config.ts` | `npm run test:e2e` |
| E2E UI | Playwright | - | `npm run test:e2e:ui` |

## ディレクトリ構造

```
src/
├── lib/
│   ├── api/           # APIロジックと単体テスト
│   │   ├── *.ts       # ロジック
│   │   └── *.test.ts  # テスト
│   └── home/          # UIロジックと単体テスト
│       ├── *.ts
│       └── *.test.ts
└── test/
    └── setup.ts       # テストセットアップ

e2e/
├── *.spec.ts          # E2Eテスト
└── api/               # API E2Eテスト
```

## 単体テスト（Vitest）

### 方針

- **TDD**: テストを先に書き、実装を後から行う
- **純粋関数の抽出**: テスト可能なロジックをRoute Handlerから分離
- **ファイル命名**: `*.test.ts` または `*.test.tsx`
- **配置**: テスト対象ファイルと同じディレクトリに配置

### テスト構造

```typescript
import { describe, it, expect } from "vitest";

describe("関数名/機能名", () => {
  describe("正常系", () => {
    it("期待される動作を説明する", () => {
      // Arrange
      const input = ...;

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(...);
    });
  });

  describe("境界値", () => {
    it("境界条件での動作を確認する", () => {
      // ...
    });
  });

  describe("異常系", () => {
    it("エラー時の動作を確認する", () => {
      // ...
    });
  });
});
```

### 実行例

```bash
# 全テスト実行
npm run test

# 特定ファイルのみ
npm run test -- src/lib/api/featured.test.ts

# 監視モード
npm run test:watch
```

## E2Eテスト（Playwright）

### 方針

- **認証**: 認証が必要なテストは `test.skip` で無効化し、storageState設定後に有効化
- **モック**: APIレスポンスをモックしてUIの動作を検証
- **プロジェクト**: Desktop Chrome + Mobile Safari

### テスト構造

```typescript
import { test, expect } from "@playwright/test";

test.describe("機能名", () => {
  test.beforeEach(async ({ page }) => {
    // 共通セットアップ（モック設定など）
  });

  test("テストケース説明", async ({ page }) => {
    await page.goto("/");

    // 要素の確認
    await expect(page.getByTestId("element")).toBeVisible();

    // インタラクション
    await page.getByRole("button", { name: "ボタン" }).click();

    // 結果の検証
    await expect(page).toHaveURL(/.*expected/);
  });
});
```

### 認証が必要なテスト

```typescript
// 認証が必要なテストはスキップ
test.skip("認証が必要なテスト", async ({ page }) => {
  // storageState設定後に有効化
});
```

### 実行例

```bash
# 全E2Eテスト
npm run test:e2e

# 特定プロジェクト
npm run test:e2e -- --project=chromium

# 特定ファイル
npm run test:e2e -- e2e/home-mocked.spec.ts

# UIモード
npm run test:e2e:ui
```

## テスト用data-testid

UIコンポーネントには `data-testid` 属性を付与してテストから参照しやすくする。

### 命名規則

| パターン | 例 |
|----------|-----|
| コンテナ | `month-tabs`, `photo-grid`, `yearly-archive` |
| インタラクティブ要素 | `yearly-hub-button`, `month-tab-{n}` |
| 状態属性 | `data-selected`, `data-available` |

### 使用例

```tsx
// コンポーネント側
<div data-testid="month-tabs">
  <button
    data-testid={`month-tab-${month}`}
    data-selected={isSelected}
  >
    {month}月
  </button>
</div>

// テスト側
const monthTabs = page.getByTestId("month-tabs");
const tab = page.getByTestId("month-tab-1");
await expect(tab).toHaveAttribute("data-selected", "true");
```

## CI/CD統合

### GitHub Actions（推奨設定）

```yaml
- name: Run unit tests
  run: npm run test

- name: Run E2E tests
  run: npx playwright install --with-deps && npm run test:e2e
```

### 環境変数

- `CI=true`: CIモードでテスト実行（Playwrightのretry有効化など）

## ベストプラクティス

1. **テストは独立**: 各テストは他のテストに依存しない
2. **明確な命名**: テスト名で何をテストしているか分かるようにする
3. **Arrange-Act-Assert**: 3Aパターンでテストを構造化
4. **境界値テスト**: エッジケースを必ずカバー
5. **モックは最小限**: 必要な箇所のみモック
6. **定期実行**: コミット前に `npm run test` を実行

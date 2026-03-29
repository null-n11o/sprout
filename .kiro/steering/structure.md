# プロジェクト構造

## 構成の考え方

機能ドメイン単位でコンポーネントと API を整理。`src/app/` はNext.js App Routerのルーティング、`src/components/` はドメイン別UI、`src/lib/` はロジックと外部サービス接続。

## ディレクトリパターン

### API（Route Handlers）
**場所**: `src/app/api/`
**目的**: Next.js Route Handler。1リソース1ディレクトリ、`[id]/route.ts` で動的ルート
**例**: `src/app/api/posts/route.ts`、`src/app/api/posts/[id]/reactions/route.ts`

### ページ
**場所**: `src/app/`
**目的**: 各ページは `page.tsx`。認証が必要なページは `<AuthGuard>` でラップ
**例**: `src/app/monthly/[year]/[month]/photos/page.tsx`

### コンポーネント
**場所**: `src/components/{domain}/`
**目的**: ドメイン別UIコンポーネント。ドメインごとに `index.ts` で再エクスポート
**ドメイン**: `auth`, `growth`, `home`, `layout`, `monthly`, `settings`, `timeline`, `ui`

### ライブラリ（ロジック・サービス）
**場所**: `src/lib/`
**目的**: APIロジック、外部サービスクライアント、ユーティリティ
**サブディレクトリ**: `api/`（ビジネスロジック）、`supabase/`、`gemini/`、`r2/`、`home/`

### E2Eテスト
**場所**: `e2e/`
**目的**: Playwright テスト。`e2e/api/` でAPI E2E、ルート直下でページE2E

## 命名規則

- **コンポーネントファイル**: PascalCase（`HomeGallery.tsx`）
- **ロジックファイル**: camelCase または kebab-case（`gemini.ts`）
- **APIルート**: 常に `route.ts`
- **テストファイル**: `*.test.ts(x)` または `*.spec.ts`（E2E）
- **インデックス**: `index.ts` でドメインコンポーネントを再エクスポート

## インポート規則

```typescript
// 絶対パス（エイリアス使用）
import { AuthGuard } from "@/components/auth";
import { createClient } from "@/lib/supabase/server";

// 相対パス（同ドメイン内）
import { generateCaption } from "./gemini";
```

**パスエイリアス**: `@/` → `src/`

## コード構成原則

- **ロジック分離**: Route Handler にビジネスロジックを書かず、`src/lib/api/` に純粋関数として抽出してテスト可能にする
- **Server / Client 分離**: `"use client"` は必要最小限。データフェッチはサーバーコンポーネントを優先
- **型定義**: API レスポンス型はコロケーション（使う場所に近い場所で定義）

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_

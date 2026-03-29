# テクノロジースタック

## アーキテクチャ

Next.js App Router を中心とした フルスタックPWA。フロントエンドとAPIルートを同一リポジトリで管理し、Supabaseがデータ層（DB・認証・RLS）を担当。ストレージはAWS S3互換のR2。

## コアテクノロジー

- **言語**: TypeScript（strict モード）
- **フレームワーク**: Next.js 16（App Router）
- **ランタイム**: Node.js（Vercel）
- **UI**: React 19 + Tailwind CSS v3 + Framer Motion
- **DB/認証**: Supabase（PostgreSQL + Row Level Security）
- **ストレージ**: AWS S3互換（Cloudflare R2 or S3）
- **AI**: Google Gemini API（画像キャプション生成）
- **PWA**: Service Worker（manifest.ts）

## 主要ライブラリ

| 用途 | ライブラリ |
|------|-----------|
| アニメーション | framer-motion |
| アイコン | lucide-react |
| グラフ | recharts |
| テスト（単体） | Vitest + Testing Library |
| テスト（E2E） | Playwright |
| フォーマット | Prettier + prettier-plugin-tailwindcss |
| Lint | ESLint（eslint-plugin-react, react-hooks） |

## 開発規約

### 型安全
- TypeScript strict。`any` 禁止

### スタイリング
- Tailwind CSS のユーティリティクラスを基本とする
- カスタムカラー（mare系＝ピンク、kairi系＝ブルー）はtailwind.config で定義

### API設計
- `src/app/api/` 以下に Route Handler（`route.ts`）
- 認証はすべてのAPIで Supabase `getUser()` による検証必須
- レスポンスは `NextResponse.json()` で返す

## 開発コマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# 単体テスト
npm run test

# E2Eテスト
npm run test:e2e
```

## 主要な技術的決定

- **App Router採用**: Pages Routerより Server Component・ストリーミングの恩恵を受けられる
- **Supabase RLS**: APIレイヤーだけでなくDB側でもアクセス制御を担保
- **S3 Presign Upload**: ファイルはサーバー経由でなく、クライアントから直接S3へアップロード（帯域節約）
- **Gemini無料枠活用**: AI機能は家族用途のため低コスト運用を前提とする

---
_Document standards and patterns, not every dependency_

# Requirements Document

## Project Description (Input)
世界一温かいクローズド家族専用SNS「Sprout」

---

## 1. プロジェクト概要 (Executive Summary)

### 1.1 プロダクトの定義

**「世界一温かいクローズド家族専用SNS」**
甥っ子カイリと姪っ子稀（マレ）の成長記録を、写真・動画・身体測定データとともに保存し、AIによる自動生成日記を通じて家族間のコミュニケーションを活性化させるPWA（Progressive Web App）。クローズド中野家限定SNS。

### 1.2 解決する課題 (Pain Points)

- **姉:** 育児が忙しく、日記を書く時間がない。写真フォルダがパンパンで整理できていない。
- **家族:** LINEで写真が送られてきても、保存期限が切れたり、後から見返すのが大変。
- **未来の子供たち:** 自分が赤ちゃんの頃、何をしていたか知りたい。

### 1.3 コアバリュー (Core Value)

- 身長、体重、写真、できるようになったこと全てを一元で管理できる
- 家族間のコミュニケーションをこの子供の情報を起点に増やす
- 10年後も色褪せない、安全なデジタル成長記録データ・アルバム。

---

## 2. ユーザーロール (User Roles)

| ロール | 想定ユーザー | 権限 |
| --- | --- | --- |
| **Admin** | 私 | 全機能へのアクセス、AIプロンプトの調整、ユーザー招待 |
| **Editor** | 姉、旦那さん、おじいちゃん、おばあちゃん | 写真/動画のアップロード、身体データの入力、編集、削除 |

---

## 3. 機能要件 (Functional Requirements)

### 3.1 タイムライン機能 (The Feed)

- Instagramライクな縦スクロールUI
- 写真または動画を大きく表示
- **AI生成キャプション**を表示（編集可能）
- 投稿日と「月齢/年齢」を自動計算して表示（例: `2025/12/08 (稀: 生後2ヶ月)`）
- フィルタリング機能: 「全員」「カイリのみ」「稀のみ」

### 3.2 アップロード & AI代筆機能 (Magic Upload)

- 写真が年、月ごとに保存され、時系列で見返すことができる
- 写真のアップロード時に日記も任意で入力が可能

### 3.3 身体測定ログ (Growth Log)

- 身長(cm)・体重(kg)の入力フォーム
- 身長や体重を月毎に記録し、グラフで成長記録が見える

### 3.4 リアクション機能 (Family Love)

- いいねボタン（ハート）
- コメント機能（おじいちゃん、おばあちゃんからの「大きくなったね！」など）

---

## 4. 技術スタック (Technology Stack)

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript | PWA対応 |
| スタイリング | Tailwind CSS | カスタムテーマ設定 |
| バックエンド/DB | Supabase (PostgreSQL) | 認証・RLS・リアルタイム |
| ストレージ | Cloudflare R2 | S3互換、Egress無料 |
| AI | Gemini API (Google) | キャプション自動生成、無料枠活用 |
| ホスティング | Vercel | Next.js統合 |
| PWA | next-pwa | Service Worker |

---

## 5. データベーススキーマ (Database Schema)

- `profiles`: 家族のユーザー情報 (id, name, birth_date, gender, avatar_url, role, created_at)
- `children`: 子供情報 (id, name, birth_date, gender, avatar_url, created_at)
- `posts`: 投稿 (id, child_id, user_id, media_url, media_type, caption, created_at)
- `growth_records`: 成長記録 (id, child_id, height, weight, memo, recorded_at)
- `reactions`: いいね (id, post_id, user_id, created_at)
- `comments`: コメント (id, post_id, user_id, content, created_at)

---

## 6. UI/UX イメージ (Design Guidelines)

- **Color Palette:**
  - Base: Soft White / Cream
  - Primary (Mare): Pastel Pink / Coral
  - Secondary (Kairi): Pastel Blue / Mint Green
- **Font:** 丸ゴシック体（M PLUS Rounded 1c）を使用し、柔らかい印象に
- **Navigation:** 下部固定のタブバー（ホーム / 投稿 / 成長記録 / 設定）

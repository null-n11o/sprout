# Research & Design Decisions

## Summary
- **Feature**: `sprout-family-sns`
- **Discovery Scope**: New Feature (グリーンフィールド)
- **Key Findings**:
  - Next.js 14 App Router + next-pwa でPWA構築可能
  - Supabase RLS でクローズド家族限定アクセス制御を実現
  - Cloudflare R2 は S3互換API で presigned URL によるダイレクトアップロード対応
  - Gemini API の Vision 機能で画像からキャプション自動生成（無料枠活用）

## Research Log

### Next.js 14 App Router + PWA
- **Context**: PWAとしてオフライン対応、ホーム画面追加が必要
- **Sources Consulted**: next-pwa公式、Next.js App Router ドキュメント
- **Findings**:
  - `next-pwa` は App Router 対応済み
  - Service Worker による画像キャッシュでオフライン閲覧可能
  - Web Push Notifications は将来的に追加可能
- **Implications**: `next.config.js` で PWA 設定、manifest.json の配置

### Supabase 認証 & RLS
- **Context**: クローズド家族限定SNSのため招待制認証が必要
- **Sources Consulted**: Supabase Auth / RLS ドキュメント
- **Findings**:
  - Magic Link (メール認証) が家族向けに最適（パスワード不要）
  - RLS ポリシーで `profiles` テーブルに存在するユーザーのみアクセス許可
  - Admin が招待リンクを発行 → 家族がクリックで登録
- **Implications**:
  - `auth.users` と `profiles` を連携
  - 全テーブルに RLS ポリシー適用

### Cloudflare R2 ストレージ
- **Context**: 画像・動画の保存、Egress無料でコスト効率重視
- **Sources Consulted**: Cloudflare R2 ドキュメント、S3互換API仕様
- **Findings**:
  - Presigned URL でクライアントからダイレクトアップロード可能
  - `@aws-sdk/client-s3` で R2 操作可能
  - 公開バケットまたは presigned URL で配信
- **Implications**:
  - API Route で presigned URL 発行
  - 画像パス: `children/{child_id}/{year}/{month}/{filename}`

### Gemini API Vision
- **Context**: 写真からAIキャプション自動生成（育児日記代筆）
- **Sources Consulted**: Google AI Studio / Gemini API ドキュメント
- **Findings**:
  - `gemini-1.5-flash` が Vision 対応、無料枠あり（15 RPM, 1M TPM）
  - Base64 または URL で画像送信可能
  - 日本語プロンプトで自然な育児日記風キャプション生成可能
  - 無料枠で家族SNS規模なら十分対応可能
- **Implications**:
  - アップロード後に非同期でキャプション生成
  - プロンプトは Admin がカスタマイズ可能に
  - `@google/generative-ai` SDK を使用

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Layered (採用) | UI → API Routes → Supabase/R2 | シンプル、Next.js 標準パターン | 大規模化時に複雑化 | 家族5人程度なら十分 |
| Hexagonal | Ports & Adapters | テスト容易、交換可能 | オーバーエンジニアリング | 将来拡張時に検討 |

## Design Decisions

### Decision: 認証方式
- **Context**: クローズドSNSのためセキュアかつ家族が使いやすい方式
- **Alternatives Considered**:
  1. パスワード認証 — 管理が煩雑
  2. Magic Link — メールでワンクリックログイン
  3. LINE Login — 導入コスト高
- **Selected Approach**: Magic Link (Supabase Auth)
- **Rationale**: パスワード不要で高齢の祖父母も使いやすい
- **Trade-offs**: メールアドレス必須
- **Follow-up**: 招待フローのUX検証

### Decision: 画像アップロードフロー
- **Context**: 大容量画像をサーバー負荷なくアップロード
- **Alternatives Considered**:
  1. サーバー経由アップロード — サーバー負荷大
  2. Presigned URL ダイレクトアップロード — クライアント直接R2へ
- **Selected Approach**: Presigned URL
- **Rationale**: サーバーレス、Vercel の関数制限回避
- **Trade-offs**: クライアント側処理が増える
- **Follow-up**: 動画の容量制限設定

### Decision: AI キャプション生成タイミング
- **Context**: 写真アップロード時に自動で日記生成
- **Alternatives Considered**:
  1. 同期生成 — アップロード完了まで待機
  2. 非同期生成 — バックグラウンドで生成、後から表示
- **Selected Approach**: 非同期生成 (Supabase Edge Functions)
- **Rationale**: UX優先、アップロードは即完了させたい
- **Trade-offs**: キャプション表示までラグあり
- **Follow-up**: 生成中のローディング表示

## Risks & Mitigations
- R2 の presigned URL 有効期限切れ — 短めの有効期限(15分)で発行、フロントで再取得ロジック
- Gemini API レート制限（15 RPM）— 家族規模なら十分、バッチ処理不要
- オフライン時のデータ同期 — PWA キャッシュ + 再接続時の自動同期

## References
- [Next.js App Router](https://nextjs.org/docs/app)
- [next-pwa](https://github.com/shadowwalker/next-pwa)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Gemini API](https://ai.google.dev/docs)

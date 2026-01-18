/**
 * スーパー管理者の設定
 * 全ユーザーを管理できる特権ユーザー
 */

// スーパー管理者のメールアドレス
// 環境変数で設定するか、ここにハードコード
const SUPER_ADMIN_EMAILS: string[] = [
  "nakano.kentaro7@gmail.com",
  // 環境変数から追加のアドレスを読み込む
  ...(process.env.SUPER_ADMIN_EMAILS?.split(",").map((e) => e.trim()) || []),
].filter(Boolean);

/**
 * 指定されたメールアドレスがスーパー管理者かどうかを判定
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email);
}

/**
 * スーパー管理者のメールアドレス一覧を取得（デバッグ用）
 */
export function getSuperAdminEmails(): string[] {
  return [...SUPER_ADMIN_EMAILS];
}

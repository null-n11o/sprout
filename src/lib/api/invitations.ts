/**
 * 招待コード生成・検証ロジック
 *
 * 紛らわしい文字（0, O, I, 1, L）を除外した8文字の英数字コードを生成し、
 * 有効期限と使用回数による検証を行う
 */

// 紛らわしい文字のリスト（除外対象）
export const CONFUSING_CHARS = ["0", "O", "I", "1", "L"];

// 使用可能な文字（紛らわしい文字を除外）
const ALLOWED_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// コード長
const CODE_LENGTH = 8;

// 招待の有効期間（日）
export const INVITATION_EXPIRY_DAYS = 7;

// 招待データ型
export type Invitation = {
  id: string;
  code: string;
  createdBy: string;
  expiresAt: Date;
  usedCount: number;
  maxUses: number;
  isActive: boolean;
};

// エラー型
export type InvitationError =
  | { type: "EXPIRED"; message: string }
  | { type: "MAX_USES_REACHED"; message: string }
  | { type: "NOT_FOUND"; message: string }
  | { type: "ALREADY_MEMBER"; message: string };

// Result型
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * 招待コードを生成する
 * 8文字の英数字（紛らわしい文字を除外）
 */
export function generateInvitationCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
    code += ALLOWED_CHARS[randomIndex];
  }
  return code;
}

/**
 * コードフォーマットが有効かどうかを検証する
 * - 8文字の大文字英数字のみ
 */
export function isCodeValid(code: string): boolean {
  if (code.length !== CODE_LENGTH) {
    return false;
  }
  return /^[A-Z0-9]+$/.test(code);
}

/**
 * 招待の検証結果を返す
 * - 無効化されていないか
 * - 有効期限内か
 * - 使用回数上限に達していないか
 */
export function validateInvitationResult(
  invitation: Invitation,
  now: Date = new Date()
): Result<Invitation, InvitationError> {
  // 無効化チェック
  if (!invitation.isActive) {
    return {
      ok: false,
      error: {
        type: "NOT_FOUND",
        message: "招待コードが見つかりません",
      },
    };
  }

  // 有効期限チェック
  if (invitation.expiresAt < now) {
    return {
      ok: false,
      error: {
        type: "EXPIRED",
        message: "招待コードの有効期限が切れています",
      },
    };
  }

  // 使用回数チェック
  if (invitation.usedCount >= invitation.maxUses) {
    return {
      ok: false,
      error: {
        type: "MAX_USES_REACHED",
        message: "招待コードは既に使用されています",
      },
    };
  }

  return { ok: true, value: invitation };
}

/**
 * 有効期限を計算する
 */
export function calculateExpiryDate(
  from: Date = new Date()
): Date {
  const expiresAt = new Date(from);
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);
  return expiresAt;
}

/**
 * 招待リンクを生成する
 */
export function generateInvitationLink(
  code: string,
  baseUrl: string
): string {
  return `${baseUrl}/invite/${code}`;
}

"use client";

import { useState, useCallback } from "react";
import { Modal } from "./Modal";
import { Copy, Check, Share2, Loader2 } from "lucide-react";

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface InvitationData {
  code: string;
  link: string;
  expiresAt: string;
}

export function InvitationModal({ isOpen, onClose }: InvitationModalProps) {
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const generateInvitation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("招待コードの生成に失敗しました");
      }

      const data = await response.json();
      setInvitation(data);
    } catch {
      setError("招待コードの生成に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string, type: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "code") {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      } else {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    } catch {
      setError("クリップボードへのコピーに失敗しました");
    }
  }, []);

  const shareInvitation = useCallback(async () => {
    if (!invitation) return;

    const shareData = {
      title: "Sproutへの招待",
      text: `家族SNS「Sprout」に招待されました！\n\n招待コード: ${invitation.code}`,
      url: invitation.link,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // ユーザーがキャンセルした場合は無視
      }
    } else {
      // Web Share APIが使用できない場合はリンクをコピー
      copyToClipboard(invitation.link, "link");
    }
  }, [invitation, copyToClipboard]);

  const handleClose = useCallback(() => {
    setInvitation(null);
    setError(null);
    setCodeCopied(false);
    setLinkCopied(false);
    onClose();
  }, [onClose]);

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="家族を招待">
      <div className="p-4">
        {!invitation ? (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm leading-relaxed">
              招待コードを生成して、家族に共有しましょう。
              招待コードは7日間有効で、1回のみ使用できます。
            </p>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={generateInvitation}
              disabled={isLoading}
              className="w-full py-3 bg-mare-400 text-white rounded-xl font-medium hover:bg-mare-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  生成中...
                </>
              ) : (
                "招待コードを生成"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">招待コード</p>
              <div className="flex items-center justify-center gap-2">
                <span
                  className="text-3xl font-mono font-bold text-gray-800 tracking-widest"
                  data-testid="invitation-code"
                >
                  {invitation.code}
                </span>
                <button
                  onClick={() => copyToClipboard(invitation.code, "code")}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="コードをコピー"
                >
                  {codeCopied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 bg-cream-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">招待リンク</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={invitation.link}
                  className="flex-1 text-sm text-gray-600 bg-transparent truncate"
                  data-testid="invitation-link"
                />
                <button
                  onClick={() => copyToClipboard(invitation.link, "link")}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                  title="リンクをコピー"
                >
                  {linkCopied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              有効期限: {formatExpiryDate(invitation.expiresAt)}
            </div>

            <button
              onClick={shareInvitation}
              className="w-full py-3 bg-mare-400 text-white rounded-xl font-medium hover:bg-mare-500 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              共有する
            </button>

            <button
              onClick={generateInvitation}
              disabled={isLoading}
              className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              新しいコードを生成
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

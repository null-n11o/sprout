"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-2">
          問題が発生しました
        </h1>

        <p className="text-gray-500 mb-8">
          予期せぬエラーが発生しました。
          <br />
          お手数ですが、もう一度お試しください。
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            再試行
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 bg-white text-gray-800 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            ホームに戻る
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-gray-400">
            エラーID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

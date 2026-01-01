import { FileQuestion, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <FileQuestion className="w-8 h-8 text-gray-400" />
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-2">
          ページが見つかりません
        </h1>

        <p className="text-gray-500 mb-8">
          お探しのページは存在しないか、
          <br />
          移動した可能性があります。
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 transition-colors"
        >
          <Home className="w-5 h-5" />
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}

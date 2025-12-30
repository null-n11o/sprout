"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const supabase = createBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "メールを送信しました。リンクをクリックしてログインしてください。",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-mare-500 mb-2">Sprout</h1>
          <p className="text-gray-500">家族の成長記録</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm p-6">
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-mare-300 focus:ring-2 focus:ring-mare-100 outline-none transition-colors"
            />
          </div>

          {message && (
            <div
              className={`mb-4 p-4 rounded-xl text-sm ${
                message.type === "success"
                  ? "bg-kairi-50 text-kairi-500"
                  : "bg-mare-50 text-mare-500"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-mare-400 hover:bg-mare-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "送信中..." : "ログインリンクを送信"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          招待されたメールアドレスでログインできます
        </p>
      </div>
    </div>
  );
}

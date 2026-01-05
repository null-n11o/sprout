"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sprout, Sparkles } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "このメールアドレスはログインが許可されていません。管理者にお問い合わせください。",
  auth_failed: "認証に失敗しました。もう一度お試しください。",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error && ERROR_MESSAGES[error]) {
      setMessage({ type: "error", text: ERROR_MESSAGES[error] });
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setGoogleLoading(false);
    }
  };

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
    <>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`mb-5 p-4 rounded-2xl text-sm backdrop-blur-sm ${
            message.type === "success"
              ? "bg-kairi-100/80 text-kairi-600 border border-kairi-200/50"
              : "bg-red-50/80 text-red-600 border border-red-200/50"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="card-glass p-7"
      >
        <motion.button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 bg-white/80 hover:bg-white border border-gray-100 text-gray-700 font-medium rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-soft hover:shadow-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {googleLoading ? "接続中..." : "Googleでログイン"}
        </motion.button>

        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200/60"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white/60 backdrop-blur-sm rounded-full text-gray-400">または</span>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-5">
            <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2.5">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-white/50 focus:border-mare-300 focus:bg-white focus:ring-4 focus:ring-mare-100/50 outline-none transition-all placeholder:text-gray-300"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 bg-gradient-to-r from-mare-400 to-mare-500 hover:from-mare-500 hover:to-mare-600 text-white font-semibold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-glow"
          >
            {loading ? "送信中..." : "メールでログイン"}
          </motion.button>
        </form>
      </motion.div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen gradient-mesh-login flex items-center justify-center px-4 py-8 overflow-hidden relative">
      {/* Decorative floating blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute -top-20 -right-20 w-64 h-64 bg-mare-200/30 blob floating-slow"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute -bottom-32 -left-20 w-80 h-80 bg-kairi-200/30 blob floating-delayed"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="absolute top-1/4 -left-10 w-40 h-40 bg-cream-200/40 blob floating-slow"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo and title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-mare-400 to-mare-500 shadow-glow mb-5"
            whileHover={{ rotate: [0, -10, 10, -5, 0], scale: 1.05 }}
            transition={{ duration: 0.5 }}
          >
            <Sprout className="w-10 h-10 text-white" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-4xl font-bold text-gradient-warm mb-3 tracking-tight">
            Sprout
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Sparkles className="w-4 h-4 text-mare-300" />
            <p className="text-base">家族の成長記録</p>
            <Sparkles className="w-4 h-4 text-kairi-300" />
          </div>
        </motion.div>

        <Suspense
          fallback={
            <div className="card-glass p-7 animate-pulse">
              <div className="h-12 bg-gray-200/50 rounded-2xl mb-7" />
              <div className="h-px bg-gray-200/50 mb-7" />
              <div className="h-10 bg-gray-200/50 rounded-2xl mb-5" />
              <div className="h-12 bg-gray-200/50 rounded-2xl" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-400 mt-8"
        >
          招待されたメールアドレスでログインできます
        </motion.p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sprout, Loader2, Users } from "lucide-react";
import { useAuth, RoleSelector } from "@/components/auth";
import { type FamilyRole } from "@/lib/api/family-members";
import { validateOnboardingState, type OnboardingState } from "@/lib/api/onboarding";

function RoleSelectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const invitationCode = searchParams.get("code");

  const [selectedRole, setSelectedRole] = useState<FamilyRole | null>(null);
  const [customRoleName, setCustomRoleName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 認証チェック：未認証の場合はログインページへリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      const loginUrl = invitationCode
        ? `/login?redirect=/onboarding/role?code=${invitationCode}`
        : "/login";
      router.replace(loginUrl);
    }
  }, [user, authLoading, router, invitationCode]);

  const state: OnboardingState = {
    selectedRole,
    customRoleName,
    invitationCode,
  };

  const validationResult = validateOnboardingState(state);
  const canSubmit = validationResult.ok && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit || !selectedRole) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/family-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          customRoleName: selectedRole === "other" ? customRoleName.trim() : null,
          invitationCode: invitationCode || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "登録に失敗しました");
      }

      // 登録成功 → ホーム画面へ
      router.push("/");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-mare-400" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mb-5 p-4 rounded-2xl text-sm backdrop-blur-sm bg-red-50/80 text-red-600 border border-red-200/50"
        >
          {error}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="card-glass p-6"
      >
        <form onSubmit={handleSubmit}>
          <p className="text-sm text-gray-600 mb-5">
            家族内での役割を選択してください
          </p>

          <RoleSelector value={selectedRole} onChange={setSelectedRole} />

          {/* Custom role name input (only for "other") */}
          {selectedRole === "other" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                役割名を入力
              </label>
              <input
                type="text"
                value={customRoleName}
                onChange={(e) => setCustomRoleName(e.target.value)}
                placeholder="例: いとこ、親戚"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mare-300 focus:border-transparent"
                data-testid="custom-role-input"
              />
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={!canSubmit}
            whileHover={canSubmit ? { scale: 1.02 } : undefined}
            whileTap={canSubmit ? { scale: 0.98 } : undefined}
            className="w-full py-3.5 bg-gradient-to-r from-mare-400 to-mare-500 hover:from-mare-500 hover:to-mare-600 text-white font-semibold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-glow flex items-center justify-center gap-2"
            data-testid="submit-button"
          >
            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {isSubmitting ? "登録中..." : "完了"}
          </motion.button>
        </form>
      </motion.div>
    </>
  );
}

export default function RoleSelectionPage() {
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
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo and title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-mare-400 to-mare-500 shadow-glow mb-4"
            whileHover={{ rotate: [0, -10, 10, -5, 0], scale: 1.05 }}
            transition={{ duration: 0.5 }}
          >
            <Sprout className="w-8 h-8 text-white" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ようこそ！
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Users className="w-4 h-4 text-mare-400" />
            <p className="text-sm">家族の役割を教えてください</p>
          </div>
        </motion.div>

        <Suspense
          fallback={
            <div className="card-glass p-6 animate-pulse">
              <div className="h-4 bg-gray-200/50 rounded w-3/4 mb-5" />
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200/50 rounded-xl" />
                ))}
              </div>
              <div className="h-12 bg-gray-200/50 rounded-2xl" />
            </div>
          }
        >
          <RoleSelectionForm />
        </Suspense>
      </div>
    </div>
  );
}

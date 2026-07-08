"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase";

export type InvitationStatus = "loading" | "valid" | "invalid" | "expired" | "used";

export function useInviteAcceptance(code: string) {
  const supabase = createBrowserClient();

  const [status, setStatus] = useState<InvitationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    async function validateCode() {
      try {
        const response = await fetch(`/api/invitations/${code}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setStatus("valid");
        } else if (response.status === 410) {
          setStatus("expired");
          setErrorMessage("この招待コードは有効期限が切れています");
        } else {
          setStatus("invalid");
          setErrorMessage(data.error || "この招待コードは無効です");
        }
      } catch {
        setStatus("invalid");
        setErrorMessage("招待コードの検証に失敗しました");
      }
    }

    if (code) {
      validateCode();
    }
  }, [code]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/onboarding/role?code=${code}`)}`,
      },
    });

    if (error) {
      console.error("Google login error:", error);
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/onboarding/role?code=${code}`)}`,
      },
    });

    if (error) {
      console.error("Email login error:", error);
      setErrorMessage(error.message);
    } else {
      setEmailSent(true);
    }
    setEmailLoading(false);
  };

  return {
    status,
    errorMessage,
    googleLoading,
    email,
    setEmail,
    emailLoading,
    emailSent,
    handleGoogleLogin,
    handleEmailLogin,
  };
}

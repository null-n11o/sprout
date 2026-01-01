"use client";

import { useState } from "react";
import { Header, BottomNav } from "@/components/layout";
import { AuthGuard, useAuth } from "@/components/auth";
import { LogOut, User, Baby, Shield, Info, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsSigningOut(false);
    }
  };

  const menuItems = [
    {
      icon: User,
      label: "アカウント情報",
      description: user?.email || "メールアドレス未設定",
      onClick: () => {},
    },
    {
      icon: Baby,
      label: "子供の管理",
      description: "子供の追加・編集",
      onClick: () => {},
    },
    {
      icon: Shield,
      label: "プライバシー",
      description: "プライバシー設定",
      onClick: () => {},
    },
    {
      icon: Info,
      label: "アプリについて",
      description: "バージョン 0.1.0",
      onClick: () => {},
    },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-cream-50">
        <Header />
        <main className="pt-14 pb-20 px-4">
          <div className="max-w-lg mx-auto py-4">
            <h1 className="text-xl font-bold text-gray-800 mb-6">設定</h1>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                      index !== menuItems.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-cream-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-800">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-2xl shadow-sm text-red-500 font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-5 h-5" />
              {isSigningOut ? "ログアウト中..." : "ログアウト"}
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}

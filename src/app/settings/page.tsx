"use client";

import { useState, useEffect, useCallback } from "react";
import { Header, BottomNav } from "@/components/layout";
import { AuthGuard, useAuth } from "@/components/auth";
import {
  ProfileEditModal,
  ChildManagement,
  AboutModal,
  InvitationModal,
  FamilyMemberManagement,
} from "@/components/settings";
import { LogOut, User, Baby, Info, ChevronRight, UserPlus, Users } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email?: string;
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Modal states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [isFamilyMemberModalOpen, setIsFamilyMemberModalOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

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

  const displayName = profile?.name || user?.email?.split("@")[0] || "ユーザー";

  const menuItems = [
    {
      icon: User,
      label: "アカウント情報",
      description: displayName,
      onClick: () => setIsProfileModalOpen(true),
    },
    {
      icon: Baby,
      label: "子供の管理",
      description: "子供の追加・編集",
      onClick: () => setIsChildModalOpen(true),
    },
    {
      icon: Users,
      label: "家族メンバー",
      description: "家族の役割を確認・編集",
      onClick: () => setIsFamilyMemberModalOpen(true),
    },
    {
      icon: UserPlus,
      label: "家族を招待",
      description: "招待コードを生成",
      onClick: () => setIsInvitationModalOpen(true),
    },
    {
      icon: Info,
      label: "アプリについて",
      description: "バージョン 0.1.0",
      onClick: () => setIsAboutModalOpen(true),
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

      {/* Modals */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentName={displayName}
        currentEmail={user?.email || ""}
        onUpdate={fetchProfile}
      />

      <ChildManagement
        isOpen={isChildModalOpen}
        onClose={() => setIsChildModalOpen(false)}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      <InvitationModal
        isOpen={isInvitationModalOpen}
        onClose={() => setIsInvitationModalOpen(false)}
      />

      <FamilyMemberManagement
        isOpen={isFamilyMemberModalOpen}
        onClose={() => setIsFamilyMemberModalOpen(false)}
      />
    </AuthGuard>
  );
}

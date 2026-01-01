"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, BottomNav } from "@/components/layout";
import { AuthGuard } from "@/components/auth";
import { UploadForm } from "@/components/upload";
import { Loader2 } from "lucide-react";

type Child = {
  id: string;
  name: string;
};

export default function UploadPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchChildren() {
      try {
        const response = await fetch("/api/children");
        if (response.ok) {
          const data = await response.json();
          setChildren(data.children);
        }
      } catch (error) {
        console.error("Failed to fetch children:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChildren();
  }, []);

  const handleSuccess = () => {
    router.push("/");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-cream-50">
        <Header />
        <main className="pt-14 pb-20 px-4">
          <div className="max-w-lg mx-auto py-4">
            <h1 className="text-xl font-bold text-gray-800 mb-6">
              新しい投稿
            </h1>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : children.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">子供のデータがありません</p>
              </div>
            ) : (
              <UploadForm
                childList={children}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            )}
          </div>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}

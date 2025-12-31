"use client";

import { useEffect, useState } from "react";
import { Header, BottomNav } from "@/components/layout";
import { AuthGuard } from "@/components/auth";
import { TimelineFeed } from "@/components/timeline";
import { Loader2 } from "lucide-react";

type Child = {
  id: string;
  name: string;
  birth_date: string;
  avatar_url: string | null;
};

export default function Home() {
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-cream-50">
        <Header />
        <main className="pt-14 pb-20 px-4">
          <div className="max-w-lg mx-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <TimelineFeed children={children} />
            )}
          </div>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}

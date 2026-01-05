"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header, BottomNav } from "@/components/layout";
import { AuthGuard, useAuth } from "@/components/auth";
import { TimelineFeed } from "@/components/timeline";
import { Sprout } from "lucide-react";

type Child = {
  id: string;
  name: string;
  birth_date: string;
  avatar_url: string | null;
};

export default function Home() {
  const { user } = useAuth();
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
      <div className="min-h-screen gradient-mesh-warm">
        <Header />
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="pt-16 pb-24 px-4"
        >
          <div className="max-w-lg mx-auto">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 gap-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-mare-400 to-mare-500 flex items-center justify-center shadow-glow"
                >
                  <Sprout className="w-6 h-6 text-white" />
                </motion.div>
                <p className="text-sm text-gray-400 font-medium">読み込み中...</p>
              </motion.div>
            ) : (
              <TimelineFeed childList={children} currentUserId={user?.id ?? ""} />
            )}
          </div>
        </motion.main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}

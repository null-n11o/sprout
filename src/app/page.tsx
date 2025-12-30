"use client";

import { Header, BottomNav } from "@/components/layout";
import { AuthGuard } from "@/components/auth";

export default function Home() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-cream-50">
        <Header />
        <main className="pt-14 pb-20 px-4">
          <div className="max-w-lg mx-auto">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">
                ようこそ Sprout へ
              </h2>
              <p className="text-gray-500 mb-8">
                家族の大切な成長の瞬間を記録しましょう
              </p>
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-kairi-100 flex items-center justify-center">
                  <span className="text-kairi-500 font-bold">カイリ</span>
                </div>
                <div className="w-16 h-16 rounded-full bg-mare-100 flex items-center justify-center">
                  <span className="text-mare-500 font-bold">稀</span>
                </div>
              </div>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}

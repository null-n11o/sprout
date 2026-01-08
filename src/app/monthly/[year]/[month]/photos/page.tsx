"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout";
import { AuthGuard } from "@/components/auth";
import { PhotoGrid } from "@/components/monthly";
import { ArrowLeft, Loader2 } from "lucide-react";

type Photo = {
  id: string;
  media_url: string;
  created_at: string;
};

export default function GalleryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const year = Number(params.year);
  const month = Number(params.month);
  const childId = searchParams.get("child_id");

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      setIsLoading(true);
      try {
        const url = childId
          ? `/api/monthly/${year}/${month}?child_id=${childId}`
          : `/api/monthly/${year}/${month}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setPhotos(data.photos || []);
        }
      } catch (error) {
        console.error("Failed to fetch photos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (year && month) {
      fetchPhotos();
    }
  }, [year, month, childId]);

  const handleBack = () => {
    router.push("/monthly");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-cream-50">
        <Header />
        <main className="pt-14 pb-6 px-4">
          <div className="max-w-lg mx-auto py-4">
            {/* ヘッダー */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="戻る"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">
                {year}年{month}月の写真
              </h1>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <PhotoGrid photos={photos} />
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

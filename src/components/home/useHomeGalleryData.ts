import { useState, useEffect, useCallback, useRef } from "react";
import { type FeaturedImage } from "@/components/home/HeroImage";
import { type YearData } from "@/components/home/YearlyArchive";
import { getCacheKey, CACHE_TTL } from "@/lib/home/gallery-cache";

export type Photo = {
  id: string;
  media_url: string;
  created_at: string;
};

export type ViewMode = "monthly" | "yearly";

// キャッシュされたデータの型
type CachedMonthlyData = {
  featured: FeaturedImage;
  photos: Photo[];
  availableMonths: number[];
  timestamp: number;
};

interface UseHomeGalleryDataParams {
  currentYear: number;
  currentMonth: number;
  selectedChildId: string | null;
  viewMode: ViewMode;
}

export function useHomeGalleryData({
  currentYear,
  currentMonth,
  selectedChildId,
  viewMode,
}: UseHomeGalleryDataParams) {
  const [featuredImage, setFeaturedImage] = useState<FeaturedImage>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [years, setYears] = useState<YearData[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // クライアントサイドキャッシュ
  const monthlyCache = useRef<Map<string, CachedMonthlyData>>(new Map());
  const yearsCache = useRef<{
    data: YearData[];
    childId: string | null;
    timestamp: number;
  } | null>(null);

  const fetchAvailableMonths = useCallback(async () => {
    try {
      const childParam = selectedChildId ? `?child_id=${selectedChildId}` : "";
      const res = await fetch(`/api/monthly/${currentYear}${childParam}`);

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      return data.availableMonths || [];
    } catch {
      return [];
    }
  }, [currentYear, selectedChildId]);

  const fetchMonthlyData = useCallback(async () => {
    const cacheKey = getCacheKey(currentYear, currentMonth, selectedChildId);
    const cached = monthlyCache.current.get(cacheKey);

    // キャッシュが有効な場合はキャッシュから取得
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setFeaturedImage(cached.featured);
      setPhotos(cached.photos);
      setAvailableMonths(cached.availableMonths);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const childParam = selectedChildId ? `?child_id=${selectedChildId}` : "";

      const [featuredRes, monthlyRes, months] = await Promise.all([
        fetch(`/api/featured/${currentYear}/${currentMonth}${childParam}`),
        fetch(`/api/monthly/${currentYear}/${currentMonth}${childParam}`),
        fetchAvailableMonths(),
      ]);

      if (!featuredRes.ok || !monthlyRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [featuredData, monthlyData] = await Promise.all([
        featuredRes.json(),
        monthlyRes.json(),
      ]);

      const featured = featuredData.featured;
      const photosData = monthlyData.photos || [];

      // キャッシュに保存
      monthlyCache.current.set(cacheKey, {
        featured,
        photos: photosData,
        availableMonths: months,
        timestamp: Date.now(),
      });

      setFeaturedImage(featured);
      setPhotos(photosData);
      setAvailableMonths(months);
    } catch (err) {
      setError("データの取得に失敗しました");
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth, selectedChildId, fetchAvailableMonths]);

  const fetchYearsData = useCallback(async () => {
    // キャッシュが有効な場合はキャッシュから取得
    const cached = yearsCache.current;
    if (
      cached &&
      cached.childId === selectedChildId &&
      Date.now() - cached.timestamp < CACHE_TTL * 5 // 年別データは5分間キャッシュ
    ) {
      setYears(cached.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const childParam = selectedChildId ? `?child_id=${selectedChildId}` : "";
      const res = await fetch(`/api/years${childParam}`);

      if (!res.ok) {
        throw new Error("Failed to fetch years");
      }

      const data = await res.json();
      const yearsData = data.years || [];

      // キャッシュに保存
      yearsCache.current = {
        data: yearsData,
        childId: selectedChildId,
        timestamp: Date.now(),
      };

      setYears(yearsData);
    } catch (err) {
      setError("データの取得に失敗しました");
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    if (viewMode === "monthly") {
      fetchMonthlyData();
    } else {
      fetchYearsData();
    }
  }, [viewMode, fetchMonthlyData, fetchYearsData]);

  // 子どもフィルター変更時にキャッシュをクリアするためのハンドラー
  const clearCache = useCallback(() => {
    monthlyCache.current.clear();
    yearsCache.current = null;
  }, []);

  return {
    featuredImage,
    photos,
    years,
    availableMonths,
    isLoading,
    error,
    fetchMonthlyData,
    fetchYearsData,
    clearCache,
  };
}

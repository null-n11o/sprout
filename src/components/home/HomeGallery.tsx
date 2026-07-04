"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  PanInfo,
} from "framer-motion";
import { ChildFilter } from "@/components/timeline/ChildFilter";
import { PhotoGrid } from "@/components/monthly/PhotoGrid";
import { HeroImage, type FeaturedImage } from "@/components/home/HeroImage";
import { YearlyArchive, type YearData } from "@/components/home/YearlyArchive";
import { slideUp, transitions } from "@/lib/animations";
import { Calendar } from "lucide-react";

// キャッシュのキーを生成
function getCacheKey(year: number, month: number, childId: string | null) {
  return `${year}-${month}-${childId || "all"}`;
}

// キャッシュされたデータの型
type CachedMonthlyData = {
  featured: FeaturedImage;
  photos: Photo[];
  availableMonths: number[];
  timestamp: number;
};

// キャッシュの有効期限（60秒）
const CACHE_TTL = 60 * 1000;

// スワイプのしきい値（px）
const SWIPE_THRESHOLD = 50;

type Child = {
  id: string;
  name: string;
};

type Photo = {
  id: string;
  media_url: string;
  created_at: string;
};

type ViewMode = "monthly" | "yearly";

interface HomeGalleryProps {
  childList: Child[];
  initialYear: number;
  initialMonth: number;
}

export function HomeGallery({
  childList,
  initialYear,
  initialMonth,
}: HomeGalleryProps) {
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");

  const [featuredImage, setFeaturedImage] = useState<FeaturedImage>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [years, setYears] = useState<YearData[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // スワイプアニメーション用の状態
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null
  );
  const dragX = useMotionValue(0);
  const constraintsRef = useRef(null);

  // クライアントサイドキャッシュ
  const monthlyCache = useRef<Map<string, CachedMonthlyData>>(new Map());
  const yearsCache = useRef<{ data: YearData[]; childId: string | null; timestamp: number } | null>(null);

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

  const handleMonthChange = (month: number) => {
    if (month < 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else if (month > 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth(month);
    }
  };

  const handleYearSelect = (year: number) => {
    setCurrentYear(year);
    setCurrentMonth(1);
    setViewMode("monthly");
  };

  const handleYearlyHubClick = () => {
    setViewMode("yearly");
  };

  const handleBackToMonthly = () => {
    setViewMode("monthly");
  };

  const handleChildSelect = (childId: string | null) => {
    // 子どもフィルター変更時はキャッシュをクリア（新鮮なデータを取得するため）
    if (childId !== selectedChildId) {
      monthlyCache.current.clear();
      yearsCache.current = null;
    }
    setSelectedChildId(childId);
  };

  // スワイプ終了時のハンドラー
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // しきい値を超えたか、速度が十分大きい場合に月移動
    if (Math.abs(offset) > SWIPE_THRESHOLD || Math.abs(velocity) > 500) {
      if (offset < 0) {
        // 左スワイプ → 次の月へ
        setSlideDirection("left");
        handleMonthChange(currentMonth + 1);
      } else {
        // 右スワイプ → 前の月へ
        setSlideDirection("right");
        handleMonthChange(currentMonth - 1);
      }
    }

    // ドラッグ位置をリセット
    dragX.set(0);
  };

  // スライドアニメーションのバリアント
  const slideVariants = {
    initial: (direction: "left" | "right" | null) => ({
      x: direction === "left" ? 300 : direction === "right" ? -300 : 0,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (direction: "left" | "right" | null) => ({
      x: direction === "left" ? -300 : direction === "right" ? 300 : 0,
      opacity: 0,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  // 月変更後にスライド方向をリセット
  useEffect(() => {
    if (slideDirection !== null) {
      const timer = setTimeout(() => setSlideDirection(null), 300);
      return () => clearTimeout(timer);
    }
  }, [slideDirection]);

  // Filter photos to exclude the featured image
  const gridPhotos = featuredImage
    ? photos.filter((p) => p.id !== featuredImage.id)
    : photos;

  return (
    <div className="space-y-4">
      {/* Child Filter */}
      <div data-testid="child-filter">
        <ChildFilter
          selectedChildId={selectedChildId}
          onSelect={handleChildSelect}
          childList={childList}
        />
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "monthly" ? (
          <motion.div
            key="monthly"
            variants={slideUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
          >
            {/* Month Tabs */}
            <MonthTabs
              year={currentYear}
              currentMonth={currentMonth}
              availableMonths={availableMonths}
              onMonthChange={handleMonthChange}
              onYearlyHubClick={handleYearlyHubClick}
            />

            {/* Swipeable Content */}
            <div ref={constraintsRef} className="overflow-hidden">
              <AnimatePresence mode="wait" custom={slideDirection}>
                <motion.div
                  key={`${currentYear}-${currentMonth}`}
                  data-testid="swipeable-content"
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  style={{ x: dragX }}
                  className="space-y-4 touch-pan-y"
                >
                  {isLoading ? (
                    <LoadingState />
                  ) : error ? (
                    <ErrorState message={error} onRetry={fetchMonthlyData} />
                  ) : (
                    <>
                      {/* Hero Image */}
                      <HeroImage featured={featuredImage} />

                      {/* Photo Grid */}
                      <div data-testid="photo-grid">
                        <PhotoGrid photos={gridPhotos} />
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="yearly"
            variants={slideUp}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <YearlyArchive
              years={years}
              isLoading={isLoading}
              error={error}
              onYearSelect={handleYearSelect}
              onBack={handleBackToMonthly}
              onRetry={fetchYearsData}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// MonthTabs Component
interface MonthTabsProps {
  year: number;
  currentMonth: number;
  availableMonths: number[];
  onMonthChange: (month: number) => void;
  onYearlyHubClick: () => void;
}

function MonthTabs({
  year,
  currentMonth,
  availableMonths,
  onMonthChange,
  onYearlyHubClick,
}: MonthTabsProps) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div data-testid="month-tabs" className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-800 flex-1">
          {year}年{currentMonth}月
        </h2>
      </div>

      <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
        {/* 左端に「全年表示」ボタン（Yearly Hub）を配置 */}
        <motion.button
          data-testid="yearly-hub-button"
          onClick={onYearlyHubClick}
          whileTap={{ scale: 0.95 }}
          transition={transitions.spring}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <Calendar className="w-4 h-4" />
          年別
        </motion.button>

        {months.map((month) => {
          const isSelected = month === currentMonth;
          const isAvailable = availableMonths.length === 0 || availableMonths.includes(month);

          return (
            <motion.button
              key={month}
              data-testid={`month-tab-${month}`}
              data-selected={isSelected}
              data-available={isAvailable}
              onClick={() => onMonthChange(month)}
              disabled={!isAvailable}
              whileTap={isAvailable ? { scale: 0.95 } : undefined}
              transition={transitions.spring}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                isSelected
                  ? "bg-gray-800 text-white"
                  : isAvailable
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-gray-50 text-gray-300 cursor-not-allowed"
              }`}
            >
              {month}月
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Loading State
function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// Error State
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-50 rounded-2xl p-6 text-center">
      <p className="text-red-600 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
      >
        再試行
      </button>
    </div>
  );
}

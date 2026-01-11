"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChildFilter } from "@/components/timeline/ChildFilter";
import { PhotoGrid } from "@/components/monthly/PhotoGrid";
import { HeroImage, type FeaturedImage } from "@/components/home/HeroImage";
import { slideUp, transitions } from "@/lib/animations";
import Image from "next/image";
import { Calendar, Grid3X3 } from "lucide-react";

type Child = {
  id: string;
  name: string;
};

type Photo = {
  id: string;
  media_url: string;
  created_at: string;
};

type YearData = {
  year: number;
  thumbnailUrl: string | null;
  photoCount: number;
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

  const fetchMonthlyData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const childParam = selectedChildId ? `?child_id=${selectedChildId}` : "";

      const [featuredRes, monthlyRes] = await Promise.all([
        fetch(`/api/featured/${currentYear}/${currentMonth}${childParam}`),
        fetch(`/api/monthly/${currentYear}/${currentMonth}${childParam}`),
      ]);

      if (!featuredRes.ok || !monthlyRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [featuredData, monthlyData] = await Promise.all([
        featuredRes.json(),
        monthlyRes.json(),
      ]);

      setFeaturedImage(featuredData.featured);
      setPhotos(monthlyData.photos || []);
    } catch (err) {
      setError("データの取得に失敗しました");
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth, selectedChildId]);

  const fetchYearsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const childParam = selectedChildId ? `?child_id=${selectedChildId}` : "";
      const res = await fetch(`/api/years${childParam}`);

      if (!res.ok) {
        throw new Error("Failed to fetch years");
      }

      const data = await res.json();
      setYears(data.years || []);

      // Extract available months from years data
      const allYears = (data.years || []).map(
        (y: YearData) => y.year
      ) as number[];
      setAvailableMonths(
        allYears.includes(currentYear) ? Array.from({ length: 12 }, (_, i) => i + 1) : []
      );
    } catch (err) {
      setError("データの取得に失敗しました");
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChildId, currentYear]);

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
    setSelectedChildId(childId);
  };

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
  onMonthChange,
  onYearlyHubClick,
}: MonthTabsProps) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div data-testid="month-tabs" className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          {year}年{currentMonth}月
        </h2>
        <button
          data-testid="yearly-hub-button"
          onClick={onYearlyHubClick}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          年別表示
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
        {months.map((month) => {
          const isSelected = month === currentMonth;
          return (
            <motion.button
              key={month}
              data-testid={`month-tab-${month}`}
              data-selected={isSelected}
              onClick={() => onMonthChange(month)}
              whileTap={{ scale: 0.95 }}
              transition={transitions.spring}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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

// YearlyArchive Component
interface YearlyArchiveProps {
  years: YearData[];
  isLoading: boolean;
  error: string | null;
  onYearSelect: (year: number) => void;
  onBack: () => void;
  onRetry: () => void;
}

function YearlyArchive({
  years,
  isLoading,
  error,
  onYearSelect,
  onBack,
  onRetry,
}: YearlyArchiveProps) {
  return (
    <div data-testid="yearly-archive" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">年別アーカイブ</h2>
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <Grid3X3 className="w-4 h-4" />
          月別表示
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : years.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <p className="text-gray-500">写真がありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {years.map((yearData) => (
            <motion.button
              key={yearData.year}
              data-testid="year-tile"
              onClick={() => onYearSelect(yearData.year)}
              whileTap={{ scale: 0.97 }}
              transition={transitions.spring}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              {yearData.thumbnailUrl ? (
                <Image
                  src={yearData.thumbnailUrl}
                  alt={`${yearData.year}年`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 200px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <p className="text-xl font-bold">{yearData.year}</p>
                <p className="text-xs opacity-80">{yearData.photoCount}枚</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}
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

"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  PanInfo,
} from "framer-motion";
import { ChildFilter } from "@/components/timeline/ChildFilter";
import { PhotoGrid } from "@/components/monthly/PhotoGrid";
import { HeroImage } from "@/components/home/HeroImage";
import { YearlyArchive } from "@/components/home/YearlyArchive";
import { MonthTabs } from "@/components/home/MonthTabs";
import { LoadingState, ErrorState } from "@/components/home/GalleryStates";
import {
  useHomeGalleryData,
  type ViewMode,
} from "@/components/home/useHomeGalleryData";
import { slideUp } from "@/lib/animations";

// スワイプのしきい値（px）
const SWIPE_THRESHOLD = 50;

type Child = {
  id: string;
  name: string;
};

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

  const {
    featuredImage,
    photos,
    years,
    availableMonths,
    isLoading,
    error,
    fetchMonthlyData,
    fetchYearsData,
    clearCache,
  } = useHomeGalleryData({
    currentYear,
    currentMonth,
    selectedChildId,
    viewMode,
  });

  // スワイプアニメーション用の状態
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null
  );
  const dragX = useMotionValue(0);
  const constraintsRef = useRef(null);

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
      clearCache();
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

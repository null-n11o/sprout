"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Grid3X3 } from "lucide-react";
import { transitions } from "@/lib/animations";

export type YearData = {
  year: number;
  thumbnailUrl: string | null;
  photoCount: number;
};

interface YearlyArchiveProps {
  years: YearData[];
  isLoading: boolean;
  error: string | null;
  onYearSelect: (year: number) => void;
  onBack: () => void;
  onRetry: () => void;
}

export function YearlyArchive({
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
            <YearTile
              key={yearData.year}
              year={yearData.year}
              thumbnailUrl={yearData.thumbnailUrl}
              photoCount={yearData.photoCount}
              onSelect={() => onYearSelect(yearData.year)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface YearTileProps {
  year: number;
  thumbnailUrl: string | null;
  photoCount: number;
  onSelect: () => void;
}

function YearTile({ year, thumbnailUrl, photoCount, onSelect }: YearTileProps) {
  return (
    <motion.button
      data-testid="year-tile"
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      transition={transitions.spring}
      className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-shadow"
    >
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={`${year}年`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 200px"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <p className="text-xl font-bold">{year}</p>
        <p className="text-xs opacity-80">{photoCount}枚</p>
      </div>
    </motion.button>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square bg-gray-200 rounded-xl animate-pulse"
        />
      ))}
    </div>
  );
}

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

"use client";

import { motion } from "framer-motion";
import { transitions } from "@/lib/animations";

type MonthSelectorProps = {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  hasPrevMonth: boolean;
  hasNextMonth: boolean;
};

export function MonthSelector({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  hasPrevMonth,
  hasNextMonth,
}: MonthSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <motion.button
        onClick={onPrevMonth}
        disabled={!hasPrevMonth}
        whileTap={{ scale: 0.9 }}
        transition={transitions.spring}
        className={`p-2 rounded-full ${
          hasPrevMonth
            ? "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
            : "text-gray-300 cursor-not-allowed"
        }`}
        aria-label="前の月"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </motion.button>

      <div className="text-lg font-semibold text-gray-800 min-w-[120px] text-center">
        {year}年{month}月
      </div>

      <motion.button
        onClick={onNextMonth}
        disabled={!hasNextMonth}
        whileTap={{ scale: 0.9 }}
        transition={transitions.spring}
        className={`p-2 rounded-full ${
          hasNextMonth
            ? "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
            : "text-gray-300 cursor-not-allowed"
        }`}
        aria-label="次の月"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </motion.button>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

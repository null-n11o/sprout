"use client";

import { motion } from "framer-motion";
import { transitions } from "@/lib/animations";
import { Calendar } from "lucide-react";

// MonthTabs Component
interface MonthTabsProps {
  year: number;
  currentMonth: number;
  availableMonths: number[];
  onMonthChange: (month: number) => void;
  onYearlyHubClick: () => void;
}

export function MonthTabs({
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
          const isAvailable =
            availableMonths.length === 0 || availableMonths.includes(month);

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

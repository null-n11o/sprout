"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

type GrowthStatsProps = {
  height: number | null;
  weight: number | null;
};

export function GrowthStats({ height, weight }: GrowthStatsProps) {
  return (
    <motion.div
      className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <h3 className="text-sm font-medium text-gray-600 mb-3">成長記録</h3>
      <div className="flex gap-6">
        <motion.div className="flex items-center gap-2" variants={staggerItem}>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <HeightIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">身長</p>
            <p className="text-lg font-semibold text-gray-800">
              {height !== null ? `${height} cm` : "記録なし"}
            </p>
          </div>
        </motion.div>

        <motion.div className="flex items-center gap-2" variants={staggerItem}>
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <WeightIcon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">体重</p>
            <p className="text-lg font-semibold text-gray-800">
              {weight !== null ? `${weight} kg` : "記録なし"}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function HeightIcon({ className }: { className?: string }) {
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
        d="M8 9l4-4 4 4m0 6l-4 4-4-4"
      />
    </svg>
  );
}

function WeightIcon({ className }: { className?: string }) {
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
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

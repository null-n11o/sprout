"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { useState, useCallback } from "react";

interface HeartButtonProps {
  isLiked: boolean;
  count: number;
  onToggle: () => void;
  disabled?: boolean;
}

export function HeartButton({ isLiked, count, onToggle, disabled }: HeartButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled) return;
    setIsAnimating(true);
    onToggle();
    setTimeout(() => setIsAnimating(false), 600);
  }, [onToggle, disabled]);

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className="flex items-center gap-1.5 p-2 -m-2 rounded-full focus-ring disabled:opacity-50"
      whileTap={{ scale: 0.9 }}
    >
      <div className="relative">
        <motion.div
          animate={
            isAnimating && isLiked
              ? {
                  scale: [1, 1.4, 1],
                  rotate: [0, -15, 15, 0],
                }
              : {}
          }
          transition={{
            duration: 0.5,
            ease: [0.68, -0.55, 0.265, 1.55],
          }}
        >
          <Heart
            className={`w-6 h-6 transition-colors duration-200 ${
              isLiked
                ? "fill-mare-500 text-mare-500"
                : "text-gray-400 hover:text-mare-400"
            }`}
          />
        </motion.div>

        {/* Burst particles */}
        <AnimatePresence>
          {isAnimating && isLiked && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{
                    scale: 1,
                    opacity: 0,
                    x: Math.cos((i * 60 * Math.PI) / 180) * 20,
                    y: Math.sin((i * 60 * Math.PI) / 180) * 20,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mare-400"
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      <motion.span
        key={count}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-sm font-medium ${
          isLiked ? "text-mare-500" : "text-gray-500"
        }`}
      >
        {count}
      </motion.span>
    </motion.button>
  );
}

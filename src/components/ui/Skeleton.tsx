"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
}: SkeletonProps) {
  const baseStyles = "skeleton";

  const variantStyles = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-xl",
  };

  const style = {
    width: width ?? (variant === "text" ? "100%" : undefined),
    height: height ?? (variant === "circular" ? width : undefined),
  };

  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
}

// Preset skeleton components for common use cases
export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

export function SkeletonText({ lines = 3, lastLineWidth = "60%" }: { lines?: number; lastLineWidth?: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? lastLineWidth : "100%"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonAvatar size={44} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" height={16} />
          <Skeleton variant="text" width="25%" height={12} />
        </div>
      </div>
      <Skeleton variant="rounded" height={200} />
      <SkeletonText lines={2} />
    </div>
  );
}

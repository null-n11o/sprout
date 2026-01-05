"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { scaleIn, transitions } from "@/lib/animations";

interface AnimatedCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: "default" | "elevated" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

const variantStyles = {
  default: "bg-white border border-gray-100",
  elevated: "bg-white shadow-medium",
  glass: "glass border border-white/20",
};

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      variant = "default",
      padding = "md",
      interactive = false,
      children,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
        whileHover={interactive ? { scale: 1.01, y: -2 } : undefined}
        whileTap={interactive ? { scale: 0.99 } : undefined}
        transition={transitions.spring}
        className={`
          rounded-2xl
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${interactive ? "cursor-pointer" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

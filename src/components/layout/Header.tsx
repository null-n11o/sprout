"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Sprout } from "lucide-react";

export function Header() {
  const { scrollY } = useScroll();

  // Transform values based on scroll position
  const headerHeight = useTransform(scrollY, [0, 60], [60, 52]);
  const titleScale = useTransform(scrollY, [0, 60], [1, 0.92]);
  const backgroundOpacity = useTransform(scrollY, [0, 60], [0.7, 0.95]);
  const blurAmount = useTransform(scrollY, [0, 60], [8, 20]);
  const borderOpacity = useTransform(scrollY, [0, 60], [0, 0.5]);
  const shadowOpacity = useTransform(scrollY, [0, 60], [0, 0.1]);
  const iconRotation = useTransform(scrollY, [0, 100], [0, 10]);

  // Smooth spring for icon
  const springRotation = useSpring(iconRotation, { stiffness: 100, damping: 20 });

  return (
    <motion.header
      style={{
        height: headerHeight,
      }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Background with dynamic blur and opacity */}
      <motion.div
        style={{
          opacity: backgroundOpacity,
          backdropFilter: useTransform(blurAmount, (v) => `blur(${v}px)`),
          WebkitBackdropFilter: useTransform(blurAmount, (v) => `blur(${v}px)`),
        }}
        className="absolute inset-0 bg-cream-50"
      />

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

      {/* Bottom border with gradient */}
      <motion.div
        style={{ opacity: borderOpacity }}
        className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-mare-200 to-transparent"
      />

      {/* Shadow layer */}
      <motion.div
        style={{
          boxShadow: useTransform(
            shadowOpacity,
            (v) => `0 4px 20px rgba(0, 0, 0, ${v})`
          ),
        }}
        className="absolute inset-0"
      />

      <div className="relative flex items-center justify-center h-full px-4">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex items-center gap-2.5"
        >
          {/* Logo with decorative ring */}
          <motion.div
            style={{ scale: titleScale, rotate: springRotation }}
            whileHover={{ scale: 1.15, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="relative"
          >
            {/* Outer glow ring */}
            <div className="absolute inset-0 -m-1 rounded-xl bg-gradient-to-br from-mare-300/30 to-kairi-300/30 blur-sm" />
            {/* Icon container */}
            <div className="relative w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-mare-400 to-mare-500 shadow-soft">
              <Sprout className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          </motion.div>

          {/* Title with enhanced gradient */}
          <motion.h1
            style={{ scale: titleScale }}
            className="text-xl font-bold text-gradient-warm tracking-tight"
          >
            Sprout
          </motion.h1>
        </motion.div>
      </div>
    </motion.header>
  );
}

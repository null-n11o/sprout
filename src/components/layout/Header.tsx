"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Sprout } from "lucide-react";

export function Header() {
  const { scrollY } = useScroll();

  // Transform values based on scroll position
  const headerHeight = useTransform(scrollY, [0, 50], [56, 48]);
  const titleScale = useTransform(scrollY, [0, 50], [1, 0.9]);
  const backgroundOpacity = useTransform(scrollY, [0, 50], [0.8, 0.95]);
  const borderOpacity = useTransform(scrollY, [0, 50], [0, 1]);
  const shadowOpacity = useTransform(scrollY, [0, 50], [0, 0.08]);

  return (
    <motion.header
      style={{
        height: headerHeight,
        backgroundColor: `rgba(255, 254, 247, ${backgroundOpacity.get()})`,
      }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
    >
      <motion.div
        style={{
          opacity: borderOpacity,
        }}
        className="absolute bottom-0 left-0 right-0 h-px bg-cream-200"
      />
      <motion.div
        style={{
          boxShadow: `0 4px 16px rgba(0, 0, 0, ${shadowOpacity.get()})`,
        }}
        className="absolute inset-0"
      />

      <div className="flex items-center justify-center h-full px-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex items-center gap-2"
        >
          <motion.div
            style={{ scale: titleScale }}
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Sprout className="w-6 h-6 text-mare-500" />
          </motion.div>
          <motion.h1
            style={{ scale: titleScale }}
            className="text-xl font-bold bg-gradient-to-r from-mare-500 to-mare-400 bg-clip-text text-transparent"
          >
            Sprout
          </motion.h1>
        </motion.div>
      </div>
    </motion.header>
  );
}

import { Variants, Transition } from "framer-motion";

// Easing functions
export const easing = {
  smooth: [0.4, 0, 0.2, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  snappy: [0.25, 0.1, 0.25, 1] as const,
  gentle: [0.25, 0.46, 0.45, 0.94] as const,
};

// Duration constants (in seconds)
export const duration = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  emphasis: 0.8,
};

// Common transitions
export const transitions = {
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 30,
  } as Transition,
  springBouncy: {
    type: "spring",
    stiffness: 300,
    damping: 20,
  } as Transition,
  smooth: {
    duration: duration.normal,
    ease: easing.smooth,
  } as Transition,
  snappy: {
    duration: duration.fast,
    ease: easing.snappy,
  } as Transition,
};

// Button tap animation
export const tapAnimation = {
  scale: 0.95,
  transition: transitions.spring,
};

export const hoverAnimation = {
  scale: 1.02,
  transition: transitions.spring,
};

// Fade in animation variants
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Slide up animation variants
export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: duration.fast },
  },
};

// Slide in from bottom (for modals/sheets)
export const slideInFromBottom: Variants = {
  initial: { y: "100%" },
  animate: {
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    y: "100%",
    transition: { duration: duration.normal },
  },
};

// Scale animation (for cards, buttons)
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: transitions.springBouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: duration.fast },
  },
};

// Stagger children animation
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
};

// Heart/Like animation
export const heartPop: Variants = {
  initial: { scale: 1 },
  liked: {
    scale: [1, 1.3, 1],
    transition: {
      duration: 0.4,
      times: [0, 0.5, 1],
      ease: easing.bounce,
    },
  },
};

// Shake animation (for errors)
export const shake: Variants = {
  initial: { x: 0 },
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};

// Page transition
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: duration.fast,
    },
  },
};

// Nav indicator animation
export const navIndicator: Variants = {
  initial: { opacity: 0, scale: 0 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: transitions.springBouncy,
  },
};

// Skeleton shimmer (CSS class helper)
export const shimmerClass = "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]";

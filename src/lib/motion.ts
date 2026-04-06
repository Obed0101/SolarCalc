import type { Transition, Variants } from "framer-motion";

/**
 * SolarCalc Pro — Animation Vocabulary
 *
 * All timings, easings, and variants defined once.
 * Change this file to tune the "feel" of the entire app.
 */

// ── Easings ──────────────────────────────────────────

export const easings = {
  /** Expo out — the signature SolarCalc ease */
  outExpo: [0.16, 1, 0.3, 1] as const,
  /** Smooth deceleration */
  outCubic: [0.33, 1, 0.68, 1] as const,
  /** Linear — for data snapping */
  linear: "linear" as const,
} as const;

// ── Transitions ──────────────────────────────────────

export const transitions = {
  /** Page enter/exit (slide + fade) */
  page: {
    duration: 0.25,
    ease: easings.outExpo,
  } satisfies Transition,

  /** Component mount (stagger children) */
  mount: {
    duration: 0.4,
    ease: easings.outExpo,
  } satisfies Transition,

  /** Live data number snap (no spring, fast) */
  number: {
    duration: 0.15,
    ease: easings.linear,
  } satisfies Transition,

  /** Micro-interactions (hover, press) */
  micro: {
    duration: 0.2,
    ease: easings.outExpo,
  } satisfies Transition,

  /** Spring for physical interactions (servo gauge, drag) */
  spring: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  },

  /** Gentle spring for layout shifts */
  gentleSpring: {
    type: "spring" as const,
    stiffness: 200,
    damping: 25,
  },
} as const;

// ── Variants ─────────────────────────────────────────

/** Fade up — default mount animation for cards, items */
export const fadeUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.mount,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: easings.outExpo },
  },
};

/** Stagger container — wrap children that use fadeUp */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
  exit: {},
};

/** Slide in from right — page transitions */
export const slideIn: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: transitions.page,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.15, ease: easings.outExpo },
  },
};

/** Scale press — tap/click feedback */
export const scalePress = {
  whileTap: { scale: 0.98 },
  transition: transitions.spring,
} as const;

/** Fade only — for simpler transitions */
export const fade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: transitions.mount,
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

/** Skeleton shimmer — infinite gradient sweep */
export const shimmer: Variants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: easings.linear,
    },
  },
};

/** Expand from zero height — for collapsibles */
export const expandHeight: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: "auto",
    opacity: 1,
    transition: transitions.mount,
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: easings.outExpo },
  },
};

/** Pulse — success feedback (servo confirmed, etc.) */
export const pulse: Variants = {
  initial: { scale: 1, opacity: 0.8 },
  animate: {
    scale: [1, 1.15, 1],
    opacity: [0.8, 0, 0],
    transition: { duration: 0.6, ease: easings.outExpo },
  },
};

// ── Helpers ──────────────────────────────────────────

/** Create stagger delay for index-based animations */
export function staggerDelay(index: number, base = 0.04): number {
  return index * base;
}

/** Wrap a variant with reduced-motion fallback */
export function withReducedMotion<T extends Variants>(
  variants: T,
  reducedMotion: boolean,
): T | { initial: object; animate: object; exit: object } {
  if (reducedMotion) {
    return {
      initial: {},
      animate: {},
      exit: {},
    };
  }
  return variants;
}

/** Centralized motion presets for Reflections.
 *
 * Rules:
 * ✓ Soft fade-in, small upward slide, gentle scale on selection
 * ✓ Smooth card transitions with expo ease
 * ✗ No bouncy springs, no aggressive animations, no excessive particles
 */

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
} as const;

export const slideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
} as const;

export const slideUpSubtle = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
} as const;

export const gentleScale = {
  whileTap: { scale: 0.97 },
} as const;

export const cardTransition = {
  duration: 0.45,
  ease: [0.16, 1, 0.3, 1] as const,
};

export const softTransition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1] as const,
};

export const quickTransition = {
  duration: 0.25,
  ease: [0.16, 1, 0.3, 1] as const,
};

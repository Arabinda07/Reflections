import { useCallback } from 'react';

/**
 * Haptic feedback hook.
 * Uses navigator.vibrate() on web, Capacitor Haptics on native.
 * Presets: light (10ms), soft (20ms), confirming (30ms pattern).
 */

type HapticPreset = 'light' | 'soft' | 'confirming';

const VIBRATION_PATTERNS: Record<HapticPreset, number | number[]> = {
  light: 10,
  soft: 20,
  confirming: 30,
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useHaptics() {
  const trigger = useCallback(async (preset: HapticPreset = 'light') => {
    if (prefersReducedMotion()) return;

    // Try Capacitor Haptics first (native)
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        // @ts-ignore — @capacitor/haptics only available in native builds
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        const style =
          preset === 'confirming'
            ? ImpactStyle.Heavy
            : preset === 'soft'
              ? ImpactStyle.Medium
              : ImpactStyle.Light;
        await Haptics.impact({ style });
        return;
      }
    } catch {
      // Not native, fall through to web
    }

    // Web vibration fallback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(VIBRATION_PATTERNS[preset]);
    }
  }, []);

  return {
    light: useCallback(() => trigger('light'), [trigger]),
    soft: useCallback(() => trigger('soft'), [trigger]),
    confirming: useCallback(() => trigger('confirming'), [trigger]),
  };
}

import { useCallback, useRef } from 'react';
import { prefersReducedMotion } from './accessibilityUtils';

/**
 * Audio feedback hook.
 * Preloads sound files and plays them on demand.
 * Respects user preference and prefers-reduced-motion.
 */

const SOUND_PATHS = {
  saveChime: '/assets/sounds/save-chime.ogg',
  completion: '/assets/sounds/completion.ogg',
  pageTurn: '/assets/sounds/page-turn.ogg',
  recapReveal: '/assets/sounds/recap-reveal.ogg',
} as const;

const STORAGE_KEY = 'reflections_sounds_enabled';

const isSoundEnabled = () => {
  if (prefersReducedMotion()) return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
};

export function useSound() {
  const contextRef = useRef<AudioContext | null>(null);
  const bufferCache = useRef<Map<string, AudioBuffer>>(new Map());

  const getContext = useCallback(() => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    return contextRef.current;
  }, []);

  const playFile = useCallback(
    async (path: string) => {
      if (!isSoundEnabled()) return;

      try {
        const ctx = getContext();
        if (ctx.state === 'suspended') await ctx.resume();

        let buffer = bufferCache.current.get(path);
        if (!buffer) {
          const response = await fetch(path);
          if (!response.ok) return;
          const arrayBuffer = await response.arrayBuffer();
          buffer = await ctx.decodeAudioData(arrayBuffer);
          bufferCache.current.set(path, buffer);
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch {
        // Silently fail — sound is non-critical
      }
    },
    [getContext],
  );

  return {
    playSaveChime: useCallback(() => playFile(SOUND_PATHS.saveChime), [playFile]),
    playCompletionSound: useCallback(() => playFile(SOUND_PATHS.completion), [playFile]),
    playPageTurn: useCallback(() => playFile(SOUND_PATHS.pageTurn), [playFile]),
    playRecapReveal: useCallback(() => playFile(SOUND_PATHS.recapReveal), [playFile]),
    setSoundEnabled: useCallback((enabled: boolean) => {
      try {
        localStorage.setItem(STORAGE_KEY, String(enabled));
      } catch {}
    }, []),
  };
}

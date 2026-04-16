import { useState, useRef, useCallback, useEffect } from 'react';

export interface AmbientTrack {
  id: string;
  label: string;
  emoji: string;
  url: string;
  color: string;
}

export const AMBIENT_TRACKS: AmbientTrack[] = [
  {
    id: 'rain',
    label: 'Soft Rain',
    emoji: '🌧️',
    url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
    color: '#818cf8',
  },
  {
    id: 'ocean',
    label: 'Ocean Waves',
    emoji: '🌊',
    url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',
    color: '#34d399',
  },
  {
    id: 'lofi',
    label: 'Lo-Fi Café',
    emoji: '☕',
    url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
    color: '#fb923c',
  },
  {
    id: 'forest',
    label: 'Forest Dawn',
    emoji: '🌿',
    url: 'https://actions.google.com/sounds/v1/ambiences/jungle_atmosphere.ogg',
    color: '#4ade80',
  },
];

const FADE_DURATION_MS = 1200; // crossfade window
const TARGET_VOLUME    = 0.38; // master volume ceiling

/**
 * useAmbientAudio
 *
 * Manages two HTMLAudioElement slots (A/B crossfade pattern).
 * Switching tracks fades the current one out while the new one fades in —
 * no abrupt cuts, no gap, no double-audio overlap.
 */
export function useAmbientAudio() {
  const [activeId, setActiveId]   = useState<string | null>(null);
  const [volume, setVolumeState]  = useState(TARGET_VOLUME);

  // Two audio slots for crossfade
  const slotA = useRef<HTMLAudioElement | null>(null);
  const slotB = useRef<HTMLAudioElement | null>(null);
  const useSlotA = useRef(true); // which slot is currently "active"

  const volumeRef = useRef(volume);
  const fadeInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearFade = () => {
    if (fadeInterval.current) clearInterval(fadeInterval.current);
    fadeInterval.current = null;
  };

  // Stop all audio cleanly on unmount
  useEffect(() => {
    return () => {
      clearFade();
      slotA.current?.pause();
      slotB.current?.pause();
    };
  }, []);

  /**
   * Crossfade: fade `outEl` from its current volume → 0,
   * simultaneously fade `inEl` from 0 → targetVol.
   */
  const crossfade = useCallback((
    outEl: HTMLAudioElement | null,
    inEl: HTMLAudioElement,
    targetVol: number,
    onDone?: () => void,
  ) => {
    clearFade();

    // Snap in-element to 0 before starting
    inEl.volume = 0;
    const steps  = 30;
    const stepMs = FADE_DURATION_MS / steps;
      // Calculate steps based on current volumeRef
      const currentTarget = volumeRef.current;
      const volStep = currentTarget / steps;

      inEl.volume = Math.min(currentTarget, inEl.volume + volStep);
      // Fade out
      if (outEl) outEl.volume = Math.max(0, outEl.volume - volStep);

      if (tick >= steps) {
        clearFade();
        if (outEl) { outEl.pause(); outEl.volume = 0; }
        inEl.volume = volumeRef.current;
        onDone?.();
      }
    }, stepMs);
  }, []);

  const playTrack = useCallback((track: AmbientTrack) => {
    // If same track is already playing, do nothing
    if (activeId === track.id) return;

    const outEl = useSlotA.current ? slotA.current : slotB.current;

    const inEl = new Audio(track.url);
    inEl.loop   = true;
    inEl.volume = 0;
    inEl.play().catch(() => {});

    // Store in the next slot
    if (useSlotA.current) {
      slotB.current = inEl;
    } else {
      slotA.current = inEl;
    }
    useSlotA.current = !useSlotA.current;

    crossfade(outEl, inEl, volume);
    setActiveId(track.id);
  }, [activeId, volume, crossfade]);

  const stopAll = useCallback(() => {
    clearFade();
    const outEl = useSlotA.current ? slotB.current : slotA.current;
    const altEl = useSlotA.current ? slotA.current : slotB.current;

    [outEl, altEl].forEach(el => {
      if (!el) return;
      let v = el.volume;
      const fade = setInterval(() => {
        v = Math.max(0, v - 0.04);
        el.volume = v;
        if (v <= 0) { el.pause(); clearInterval(fade); }
      }, 50);
    });

    slotA.current = null;
    slotB.current = null;
    useSlotA.current = true;
    setActiveId(null);
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    volumeRef.current = vol;
    // Apply to both slots to ensure whatever is currently audible updates
    if (slotA.current) slotA.current.volume = vol;
    if (slotB.current) slotB.current.volume = vol;
  }, []);

  const activeTrack = AMBIENT_TRACKS.find(t => t.id === activeId) ?? null;
  const isPlaying   = activeId !== null;

  return { isPlaying, activeId, activeTrack, volume, playTrack, stopAll, setVolume };
}

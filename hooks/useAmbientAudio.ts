import { useState, useCallback, useEffect } from 'react';
import { audioEngine } from '../services/audioEngine';

export interface AmbientTrack {
  id: string;
  label: string;
  emoji: string;
  url: string;
  color: string;
}

export const AMBIENT_TRACKS: AmbientTrack[] = [
  {
    id: 'bonfire',
    label: 'Bonfire',
    emoji: '🪵',
    url: '/assets/audio/bonfire.ogg',
    color: 'var(--track-bonfire)',
  },
  {
    id: 'jungle',
    label: 'Jungle',
    emoji: '🌿',
    url: '/assets/audio/jungle.ogg',
    color: 'var(--track-jungle)',
  },
  {
    id: 'thunderstorm',
    label: 'Thunderstorm',
    emoji: '⛈️',
    url: '/assets/audio/thunderstorm.ogg',
    color: 'var(--track-thunderstorm)',
  },
  {
    id: 'water_wind',
    label: 'Water & Wind',
    emoji: '🌊',
    url: '/assets/audio/water_wind.ogg',
    color: 'var(--track-water-wind)',
  },
];

const TARGET_VOLUME = 0.38; // Default volume level

/**
 * useAmbientAudio
 *
 * Manages ambient audio tracks using the Web Audio API Engine.
 * Provides gapless looping and 2s fade-in / 1.5s fade-out transitions.
 */
export function useAmbientAudio() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(TARGET_VOLUME);
  
  // Track synchronization with the singleton engine
  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  const playTrack = useCallback(async (track: AmbientTrack) => {
    // If same track is already playing, do nothing
    if (activeId === track.id) return;

    // Fade out previous track if any
    if (activeId) {
      audioEngine.stop(activeId, 1.5);
    }

    // Play new track with 2s fade-in handled by engine
    setActiveId(track.id);
    await audioEngine.play(track.id, track.url, volume);
  }, [activeId, volume]);

  const stopAll = useCallback(() => {
    audioEngine.stopAll(1.5);
    setActiveId(null);
  }, []);

  const setVolume = useCallback((vol: number) => {
    const safeVolume = Math.min(1.0, Math.max(0, vol));
    setVolumeState(safeVolume);
    audioEngine.setVolume(safeVolume);
  }, []);

  const activeTrack = AMBIENT_TRACKS.find(t => t.id === activeId) ?? null;
  const isPlaying = activeId !== null;

  return { isPlaying, activeId, activeTrack, volume, playTrack, stopAll, setVolume };
}

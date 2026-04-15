import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const TRACKS = [
  { id: 'lofi',   label: 'Lo-Fi Calm',    url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',        color: '#1cb0f6' },
  { id: 'ocean',  label: 'Ocean Waves',   url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg', color: '#58cc02' },
  { id: 'rain',   label: 'Soft Rain',     url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',       color: '#a78bfa' },
  { id: 'forest', label: 'Forest',        url: 'https://actions.google.com/sounds/v1/ambiences/jungle_atmosphere.ogg',   color: '#fb923c' },
];

type TrackId = typeof TRACKS[number]['id'];

/**
 * AmbientMusicButton
 * 
 * A single headphones icon in the home hero.
 * Click once → opens track picker.
 * Click a track → plays it, picker closes.
 * Click the icon again while playing → stops.
 * 
 * States: idle | hover | picking | playing | stopping
 */
export const AmbientMusicButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTrack, setActiveTrack] = useState<TrackId | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playTrack = useCallback((track: typeof TRACKS[number]) => {
    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(track.url);
    audio.loop = true;
    audio.volume = 0.35;
    audio.play().catch(() => {/* Autoplay blocked — ignore */});
    audioRef.current = audio;
    setActiveTrack(track.id);
    setIsOpen(false);
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      // Gentle fade out
      const audio = audioRef.current;
      const fadeInterval = setInterval(() => {
        if (audio.volume > 0.04) {
          audio.volume = Math.max(0, audio.volume - 0.04);
        } else {
          audio.pause();
          clearInterval(fadeInterval);
        }
      }, 60);
      audioRef.current = null;
    }
    setActiveTrack(null);
    setIsOpen(false);
  }, []);

  const handleButtonClick = () => {
    if (activeTrack) {
      stopAudio();
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  const isPlaying = activeTrack !== null;
  const currentTrack = TRACKS.find(t => t.id === activeTrack);

  // Icon color based on state
  const iconColor = isPlaying
    ? (currentTrack?.color || '#58cc02')
    : isHovered
    ? '#1cb0f6'
    : 'rgba(255,255,255,0.85)';

  return (
    <div className="relative flex flex-col items-center">
      {/* Track picker — floats above the button */}
      <AnimatePresence>
        {isOpen && !isPlaying && (
          <motion.div
            key="track-picker"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 flex flex-col gap-2 min-w-[172px]"
          >
            {TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => playTrack(track)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(229,229,229,0.7)',
                  boxShadow: '0 4px 16px -4px rgba(0,0,0,0.1)',
                }}
              >
                {/* Color dot */}
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: track.color }}
                />
                <span
                  style={{
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: '13px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#4b4b4b',
                  }}
                >
                  {track.label}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The headphone button */}
      <motion.button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleButtonClick}
        whileTap={{ scale: 0.9 }}
        className="relative flex items-center justify-center rounded-full transition-all focus-visible:outline-none"
        style={{
          width: '44px',
          height: '44px',
          backgroundColor: isPlaying
            ? 'rgba(255,255,255,0.2)'
            : isOpen
            ? 'rgba(255,255,255,0.18)'
            : 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: isPlaying
            ? `1.5px solid ${currentTrack?.color || '#58cc02'}`
            : '1.5px solid rgba(255,255,255,0.2)',
          boxShadow: isPlaying
            ? `0 0 14px -2px ${currentTrack?.color || '#58cc02'}66`
            : 'none',
        }}
        aria-label={isPlaying ? `Stop ${currentTrack?.label}` : 'Play ambient music'}
        title={isPlaying ? `Now playing: ${currentTrack?.label} · Click to stop` : 'Ambient sounds'}
      >
        {/* Headphone SVG — drawn inline for full color control */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'stroke 0.25s ease' }}
        >
          <path d="M3 14h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-6a9 9 0 0 1 18 0v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2" />
        </svg>

        {/* Playing pulse ring */}
        {isPlaying && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: `1.5px solid ${currentTrack?.color || '#58cc02'}` }}
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </motion.button>

      {/* Track label below button when playing */}
      <AnimatePresence>
        {isPlaying && (
          <motion.span
            key="track-label"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            style={{
              marginTop: '6px',
              fontFamily: 'Nunito, sans-serif',
              fontSize: '10px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.75)',
              whiteSpace: 'nowrap',
            }}
          >
            {currentTrack?.label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

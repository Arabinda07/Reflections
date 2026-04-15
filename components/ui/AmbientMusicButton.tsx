import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

const TRACKS = [
  { id: 'lofi',   label: 'Lo-Fi',       url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',                  color: '#1cb0f6' },
  { id: 'ocean',  label: 'Ocean',       url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',      color: '#58cc02' },
  { id: 'rain',   label: 'Rain',        url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',                 color: '#a78bfa' },
  { id: 'forest', label: 'Forest',      url: 'https://actions.google.com/sounds/v1/ambiences/jungle_atmosphere.ogg',             color: '#fb923c' },
];

type TrackId = typeof TRACKS[number]['id'];

/**
 * AmbientMusicButton
 *
 * Fixed to the bottom-right of the viewport so it is never clipped
 * by parent overflow:hidden containers (e.g. the hero section).
 *
 * The track picker is rendered via a Portal directly into document.body
 * so it is also guaranteed to never be clipped.
 *
 * States: idle → hover → picker open → playing
 */
export const AmbientMusicButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTrack, setActiveTrack] = useState<TrackId | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [pickerPos, setPickerPos] = useState({ bottom: 0, right: 0 });

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Close picker if clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Calculate picker position from the button's bounding rect
  const openPicker = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPickerPos({
        bottom: window.innerHeight - rect.top + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(true);
  }, []);

  const playTrack = useCallback((track: typeof TRACKS[number]) => {
    audioRef.current?.pause();
    const audio = new Audio(track.url);
    audio.loop = true;
    audio.volume = 0.35;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setActiveTrack(track.id);
    setIsOpen(false);
  }, []);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Gentle fade out
    const fade = setInterval(() => {
      if (audio.volume > 0.04) {
        audio.volume = Math.max(0, audio.volume - 0.04);
      } else {
        audio.pause();
        clearInterval(fade);
      }
    }, 60);
    audioRef.current = null;
    setActiveTrack(null);
    setIsOpen(false);
  }, []);

  const handleClick = () => {
    if (activeTrack) {
      stopAudio();
    } else if (isOpen) {
      setIsOpen(false);
    } else {
      openPicker();
    }
  };

  const isPlaying = activeTrack !== null;
  const currentTrack = TRACKS.find(t => t.id === activeTrack);

  const iconColor = isPlaying
    ? (currentTrack?.color ?? '#58cc02')
    : isHovered
    ? '#1cb0f6'
    : 'rgba(255,255,255,0.85)';

  // Track picker rendered into <body> via portal — never clipped
  const picker = isOpen && !isPlaying && createPortal(
    <motion.div
      key="track-picker"
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        bottom: pickerPos.bottom,
        right: pickerPos.right,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: '140px',
      }}
    >
      {TRACKS.map((track) => (
        <button
          key={track.id}
          onMouseDown={(e) => { e.stopPropagation(); playTrack(track); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '14px',
            backgroundColor: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(229,229,229,0.8)',
            boxShadow: '0 4px 20px -4px rgba(0,0,0,0.12)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span
            style={{
              height: '9px',
              width: '9px',
              borderRadius: '50%',
              flexShrink: 0,
              backgroundColor: track.color,
            }}
          />
          <span
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '12px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#4b4b4b',
              whiteSpace: 'nowrap',
            }}
          >
            {track.label}
          </span>
        </button>
      ))}
    </motion.div>,
    document.body
  );

  return (
    <>
      {/* Portal-rendered picker */}
      <AnimatePresence>{picker}</AnimatePresence>

      {/* Button + optional track label below */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
        <motion.button
          ref={buttonRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleClick}
          whileTap={{ scale: 0.88 }}
          aria-label={isPlaying ? `Stop ${currentTrack?.label}` : 'Ambient sounds'}
          title={isPlaying ? `Now playing: ${currentTrack?.label} · Click to stop` : 'Choose ambient sound'}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: isPlaying
              ? 'rgba(255,255,255,0.2)'
              : isOpen
              ? 'rgba(255,255,255,0.18)'
              : 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: isPlaying
              ? `1.5px solid ${currentTrack?.color ?? '#58cc02'}`
              : '1.5px solid rgba(255,255,255,0.22)',
            boxShadow: isPlaying
              ? `0 0 16px -2px ${currentTrack?.color ?? '#58cc02'}55`
              : 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s, border-color 0.2s, box-shadow 0.2s',
          }}
        >
          {/* Headphone SVG */}
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
            stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'stroke 0.25s ease' }}>
            <path d="M3 14h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-6a9 9 0 0 1 18 0v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2" />
          </svg>

          {/* Pulse ring when playing */}
          {isPlaying && (
            <motion.span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `1.5px solid ${currentTrack?.color ?? '#58cc02'}`,
                pointerEvents: 'none',
              }}
              animate={{ scale: [1, 1.5], opacity: [0.55, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.button>

        {/* Track name label — only when playing */}
        <AnimatePresence>
          {isPlaying && (
            <motion.span
              key="lbl"
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.25 }}
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '9px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'rgba(255,255,255,0.7)',
                whiteSpace: 'nowrap',
              }}
            >
              {currentTrack?.label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

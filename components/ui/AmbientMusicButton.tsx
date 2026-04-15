import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

const TRACKS = [
  { id: 'lofi',   label: 'Lo-Fi Calm',   emoji: '☕', url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',                  color: '#1cb0f6' },
  { id: 'ocean',  label: 'Ocean Waves',  emoji: '🌊', url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',      color: '#58cc02' },
  { id: 'rain',   label: 'Soft Rain',    emoji: '🌧️', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',                 color: '#a78bfa' },
  { id: 'forest', label: 'Forest',       emoji: '🌿', url: 'https://actions.google.com/sounds/v1/ambiences/jungle_atmosphere.ogg',             color: '#fb923c' },
];

type TrackId = typeof TRACKS[number]['id'];

const isMobile = () => window.innerWidth < 640;

/**
 * AmbientMusicButton
 *
 * Fixed floating button. Always visible, scroll-locked.
 *
 * Mobile  → Bottom sheet slides up (full-width, large tap targets).
 * Desktop → Compact popup floats above the button.
 *
 * Button states: idle / hover / open / playing
 */
export const AmbientMusicButton: React.FC = () => {
  const [isOpen, setIsOpen]           = useState(false);
  const [activeTrack, setActiveTrack] = useState<TrackId | null>(null);
  const [isHovered, setIsHovered]     = useState(false);
  const [showHint, setShowHint]       = useState(false);
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const buttonRef   = useRef<HTMLButtonElement | null>(null);
  const [popupRight, setPopupRight] = useState(20);

  // Show a brief "ambient sounds" hint on first mount
  useEffect(() => {
    const seen = sessionStorage.getItem('music_hint_shown');
    if (!seen) {
      const t1 = setTimeout(() => setShowHint(true), 1800);
      const t2 = setTimeout(() => { setShowHint(false); sessionStorage.setItem('music_hint_shown', '1'); }, 5000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, []);

  // Cleanup audio on unmount
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  // Close on outside click (desktop popup only)
  useEffect(() => {
    if (!isOpen || isMobile()) return;
    const handler = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const openPicker = useCallback(() => {
    if (buttonRef.current && !isMobile()) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupRight(window.innerWidth - rect.right);
    }
    setIsOpen(true);
  }, []);

  const playTrack = useCallback((track: typeof TRACKS[number]) => {
    audioRef.current?.pause();
    const audio = new Audio(track.url);
    audio.loop   = true;
    audio.volume = 0.35;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setActiveTrack(track.id);
    setIsOpen(false);
  }, []);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const fade = setInterval(() => {
      if (audio.volume > 0.04) audio.volume = Math.max(0, audio.volume - 0.04);
      else { audio.pause(); clearInterval(fade); }
    }, 60);
    audioRef.current = null;
    setActiveTrack(null);
    setIsOpen(false);
  }, []);

  const handleButtonClick = () => {
    if (activeTrack) { stopAudio(); return; }
    if (isOpen)      { setIsOpen(false); return; }
    openPicker();
  };

  const isPlaying    = activeTrack !== null;
  const currentTrack = TRACKS.find(t => t.id === activeTrack);

  const buttonBorderColor = isPlaying ? (currentTrack?.color ?? '#58cc02') : 'rgba(255,255,255,0.25)';
  const buttonGlow        = isPlaying ? `0 0 20px -4px ${currentTrack?.color ?? '#58cc02'}66` : '0 4px 16px -4px rgba(0,0,0,0.25)';
  const iconStroke        = isPlaying
    ? (currentTrack?.color ?? '#58cc02')
    : isHovered ? '#1cb0f6'
    : '#ffffff';

  // ─── Desktop popup (portal) ──────────────────────────────────────────
  const desktopPopup = !isMobile() && isOpen && !isPlaying && createPortal(
    <AnimatePresence>
      <motion.div
        key="desktop-picker"
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          bottom: 84,
          right: popupRight,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: '160px',
        }}
      >
        {TRACKS.map(track => (
          <button
            key={track.id}
            onClick={() => playTrack(track)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '11px 16px', borderRadius: '16px', textAlign: 'left',
              backgroundColor: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              border: '1.5px solid rgba(229,229,229,0.9)',
              boxShadow: '0 6px 24px -6px rgba(0,0,0,0.14)',
              cursor: 'pointer', transition: 'transform 0.14s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span style={{ fontSize: '16px' }}>{track.emoji}</span>
            <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4b4b4b', whiteSpace: 'nowrap' }}>
              {track.label}
            </span>
            <span style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: track.color, flexShrink: 0 }} />
          </button>
        ))}
      </motion.div>
    </AnimatePresence>,
    document.body
  );

  // ─── Mobile bottom sheet (portal) ────────────────────────────────────
  const mobileSheet = isMobile() && createPortal(
    <AnimatePresence>
      {isOpen && !isPlaying && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 99990,
              backgroundColor: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0,
              zIndex: 99991,
              backgroundColor: '#ffffff',
              borderRadius: '24px 24px 0 0',
              padding: '0 0 calc(env(safe-area-inset-bottom) + 20px)',
              boxShadow: '0 -8px 40px -8px rgba(0,0,0,0.18)',
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 8px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '9999px', backgroundColor: '#E5E5E5' }} />
            </div>

            {/* Title */}
            <p style={{
              textAlign: 'center', fontFamily: 'Nunito, sans-serif',
              fontSize: '11px', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.2em',
              color: '#aaaaaa', padding: '0 24px 16px',
            }}>
              Ambient Sounds
            </p>

            {/* Track list — large, finger-friendly */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px 8px' }}>
              {TRACKS.map(track => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '18px 20px',
                    borderRadius: '20px',
                    border: '2px solid #F0F0F0',
                    backgroundColor: '#FAFAFA',
                    cursor: 'pointer',
                    textAlign: 'left',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'background-color 0.15s',
                    minHeight: '72px',
                  }}
                  onTouchStart={e => (e.currentTarget.style.backgroundColor = '#F5F5F5')}
                  onTouchEnd={e => (e.currentTarget.style.backgroundColor = '#FAFAFA')}
                >
                  {/* Colour dot */}
                  <span style={{
                    width: '42px', height: '42px', borderRadius: '14px',
                    backgroundColor: `${track.color}18`,
                    border: `2px solid ${track.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', flexShrink: 0,
                  }}>
                    {track.emoji}
                  </span>
                  <span style={{
                    fontFamily: 'Nunito, sans-serif', fontSize: '16px',
                    fontWeight: 800, color: '#333333',
                  }}>
                    {track.label}
                  </span>
                  {/* Chevron */}
                  <span style={{ marginLeft: 'auto', color: '#CCCCCC', fontSize: '18px' }}>›</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      {desktopPopup}
      {mobileSheet}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
        {/* Contextual hint label — shows once on first visit */}
        <AnimatePresence>
          {showHint && !isPlaying && !isOpen && (
            <motion.div
              key="hint"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute', right: '56px', bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                padding: '6px 12px', borderRadius: '10px',
                whiteSpace: 'nowrap',
                fontFamily: 'Nunito, sans-serif', fontSize: '11px',
                fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: '#ffffff',
                pointerEvents: 'none',
              }}
            >
              Ambient Sounds
              {/* Arrow */}
              <span style={{
                position: 'absolute', right: '-6px', top: '50%', transform: 'translateY(-50%)',
                width: 0, height: 0,
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderLeft: '6px solid rgba(0,0,0,0.75)',
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* The main floating button */}
        <motion.button
          ref={buttonRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleButtonClick}
          whileTap={{ scale: 0.86 }}
          aria-label={isPlaying ? `Stop ${currentTrack?.label}` : 'Ambient sounds'}
          style={{
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '50%',
            backgroundColor: isPlaying
              ? `${currentTrack?.color ?? '#58cc02'}22`
              : 'rgba(30,30,30,0.72)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: `2px solid ${buttonBorderColor}`,
            boxShadow: buttonGlow,
            cursor: 'pointer',
            transition: 'background-color 0.2s, border-color 0.2s, box-shadow 0.2s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* Headphone icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke={iconStroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'stroke 0.25s ease' }}>
            <path d="M3 14h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-6a9 9 0 0 1 18 0v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2" />
          </svg>

          {/* Pulse ring when playing */}
          {isPlaying && (
            <motion.span
              style={{
                position: 'absolute', inset: '-2px', borderRadius: '50%',
                border: `2px solid ${currentTrack?.color ?? '#58cc02'}`,
                pointerEvents: 'none',
              }}
              animate={{ scale: [1, 1.55], opacity: [0.5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.button>

        {/* Track name below button when playing */}
        <AnimatePresence>
          {isPlaying && (
            <motion.span
              key="lbl"
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              style={{
                fontFamily: 'Nunito, sans-serif', fontSize: '9px',
                fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '0.14em', color: 'rgba(255,255,255,0.85)',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
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

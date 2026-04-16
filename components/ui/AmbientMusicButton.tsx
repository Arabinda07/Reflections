import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAmbientAudio, AMBIENT_TRACKS } from '../../hooks/useAmbientAudio';

/** Reactively tracks the Tailwind 'dark' class on <html> */
function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

/** Animated waveform — 4 bars that dance at different speeds while playing */
const WaveformBars: React.FC<{ color: string }> = ({ color }) => {
  const bars = [
    { h: [6, 14, 6],  dur: 0.55 },
    { h: [14, 6, 14], dur: 0.7  },
    { h: [8, 18, 8],  dur: 0.48 },
    { h: [16, 8, 16], dur: 0.62 },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '20px' }}>
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          style={{
            width: '3px',
            borderRadius: '9999px',
            backgroundColor: color,
          }}
          animate={{ height: bar.h.map(v => `${v}px`) }}
          transition={{
            duration: bar.dur,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
            delay: i * 0.08,
          }}
        />
      ))}
    </div>
  );
};

const isMobile = () => window.innerWidth < 640;

/**
 * AmbientMusicButton
 *
 * Floating fixed button. Uses the shared useAmbientAudio hook for
 * crossfade between tracks.
 *
 * Mobile  → Bottom sheet with mood labels + volume slider.
 * Desktop → Compact glassmorphic popup above the button.
 */
export const AmbientMusicButton: React.FC = () => {
  const [isOpen, setIsOpen]     = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const isDark    = useDarkMode();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popupRef  = useRef<HTMLDivElement | null>(null);
  const [popupRight, setPopupRight] = useState(20);

  const { isPlaying, activeTrack, volume, playTrack, stopAll, setVolume } = useAmbientAudio();

  // One-time "ambient sounds" tooltip on first visit
  useEffect(() => {
    const seen = sessionStorage.getItem('music_hint_shown');
    if (!seen) {
      const t1 = setTimeout(() => setShowHint(true), 1800);
      const t2 = setTimeout(() => {
        setShowHint(false);
        sessionStorage.setItem('music_hint_shown', '1');
      }, 5000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, []);

  // Close desktop popup on outside click
  useEffect(() => {
    if (!isOpen || isMobile()) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideButton = buttonRef.current?.contains(target);
      const isInsidePopup  = popupRef.current?.contains(target);
      
      if (!isInsideButton && !isInsidePopup) {
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

  const handleTrackClick = useCallback((track: typeof AMBIENT_TRACKS[0]) => {
    if (activeTrack?.id === track.id) {
      stopAll();
    } else {
      playTrack(track);
    }
    if (!isMobile()) setIsOpen(false);
  }, [activeTrack, playTrack, stopAll]);

  const handleButtonClick = () => {
    if (isPlaying) { stopAll(); return; }
    if (isOpen)    { setIsOpen(false); return; }
    openPicker();
  };

  // ─── Color tokens ──────────────────────────────────────────────────────
  const accentColor   = activeTrack?.color ?? '#58cc02';
  const buttonGlow    = isPlaying
    ? `0 0 22px -4px ${accentColor}80`
    : '0 4px 16px -4px rgba(0,0,0,0.28)';
  const iconStroke    = isPlaying ? accentColor : isHovered ? '#1cb0f6' : '#ffffff';

  const pickerBg     = isDark ? 'rgba(24,24,27,0.98)'  : 'rgba(255,255,255,0.97)';
  const pickerBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(229,229,229,0.9)';
  const pickerShadow = isDark
    ? '0 8px 32px -8px rgba(0,0,0,0.6), 0 2px 0 0 rgba(255,255,255,0.04)'
    : '0 8px 32px -8px rgba(0,0,0,0.16), 0 2px 0 0 #E5E5E5';
  const labelColor   = isDark ? '#a1a1aa' : '#71717a';
  const trackHoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';

  const sheetBg     = isDark ? '#18181b' : '#ffffff';
  const sheetHandle = isDark ? '#3f3f46' : '#E4E4E7';
  const sheetTitle  = isDark ? '#71717a' : '#a1a1aa';
  const trackBg     = isDark ? '#27272a' : '#fafafa';
  const trackBorder = isDark ? '#3f3f46' : '#f0f0f0';
  const trackText   = isDark ? '#e4e4e7' : '#27272a';

  // ─── Shared track row renderer ─────────────────────────────────────────
  const renderTrackRow = (track: typeof AMBIENT_TRACKS[0], compact = false) => {
    const isActive = activeTrack?.id === track.id;
    return (
      <button
        key={track.id}
        onClick={() => handleTrackClick(track)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? '10px' : '14px',
          padding: compact ? '10px 14px' : '14px 16px',
          borderRadius: compact ? '14px' : '18px',
          border: `1.5px solid ${isActive ? `${track.color}55` : compact ? pickerBorder : trackBorder}`,
          backgroundColor: isActive
            ? `${track.color}12`
            : compact ? pickerBg : trackBg,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background-color 0.15s, border-color 0.15s',
          width: '100%',
          backdropFilter: compact ? 'blur(24px)' : 'none',
          WebkitBackdropFilter: compact ? 'blur(24px)' : 'none',
          minHeight: compact ? 'auto' : '68px',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => {
          if (!isActive) e.currentTarget.style.backgroundColor = compact ? trackHoverBg : (isDark ? '#333' : '#F4F4F5');
        }}
        onMouseLeave={e => {
          if (!isActive) e.currentTarget.style.backgroundColor = isActive ? `${track.color}12` : compact ? pickerBg : trackBg;
        }}
      >
        {/* Emoji badge */}
        <span style={{
          width: compact ? '34px' : '42px',
          height: compact ? '34px' : '42px',
          borderRadius: compact ? '10px' : '14px',
          backgroundColor: `${track.color}18`,
          border: `1.5px solid ${track.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: compact ? '15px' : '19px',
          flexShrink: 0,
        }}>
          {track.emoji}
        </span>

        {/* Label + mood tag */}
        <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
          <span style={{
            fontFamily: 'Nunito, sans-serif',
            fontSize: compact ? '12px' : '14px',
            fontWeight: 800,
            color: isActive ? track.color : (compact ? (isDark ? '#e4e4e7' : '#27272a') : trackText),
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {track.label}
          </span>
        </span>

        {/* Waveform (playing) or colour dot */}
        {isActive
          ? <WaveformBars color={track.color} />
          : (
            <span style={{
              width: '7px', height: '7px',
              borderRadius: '50%',
              backgroundColor: `${track.color}70`,
              flexShrink: 0,
            }} />
          )
        }
      </button>
    );
  };

  // ─── Volume slider shared UI ───────────────────────────────────────────
  const renderVolumeSlider = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '4px 4px 0',
    }}>
      {/* Speaker low icon */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={labelColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
      <input
        type="range"
        min={0.05} max={0.8} step={0.01}
        value={volume}
        onChange={e => setVolume(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: activeTrack?.color ?? '#58cc02', cursor: 'pointer' }}
      />
      {/* Speaker high icon */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={labelColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    </div>
  );

  // ─── Desktop popup ─────────────────────────────────────────────────────
  const desktopPopup = !isMobile() && isOpen && createPortal(
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        key="desktop-picker"
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed',
          bottom: 90,
          right: popupRight,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          minWidth: '220px',
          padding: '16px',
          borderRadius: '24px',
          backgroundColor: pickerBg,
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: `1.5px solid ${pickerBorder}`,
          boxShadow: pickerShadow,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: '2px',
        }}>
          <span style={{
            fontFamily: 'Nunito, sans-serif', fontSize: '10px', fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.2em',
            color: labelColor,
          }}>
            Ambient Sounds
          </span>
          {isPlaying && (
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '7px', height: '7px', borderRadius: '50%',
                backgroundColor: accentColor,
              }}
            />
          )}
        </div>

        {/* Track list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {AMBIENT_TRACKS.map(t => renderTrackRow(t, true))}
        </div>

        {/* Volume slider — only when playing */}
        {isPlaying && renderVolumeSlider()}
      </motion.div>
    </AnimatePresence>,
    document.body
  );

  // ─── Mobile bottom sheet ───────────────────────────────────────────────
  const mobileSheet = isMobile() && createPortal(
    <AnimatePresence>
      {isOpen && (
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
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0,
              zIndex: 99991,
              backgroundColor: sheetBg,
              borderRadius: '28px 28px 0 0',
              padding: '0 16px calc(env(safe-area-inset-bottom) + 24px)',
              boxShadow: '0 -12px 48px -12px rgba(0,0,0,0.3)',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 10px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '9999px', backgroundColor: sheetHandle }} />
            </div>

            {/* Title row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 4px 18px',
            }}>
              <span style={{
                fontFamily: 'Nunito, sans-serif', fontSize: '11px', fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '0.2em', color: sheetTitle,
              }}>
                Ambient Sounds
              </span>
              {isPlaying && (
                <span style={{
                  fontFamily: 'Nunito, sans-serif', fontSize: '10px', fontWeight: 800,
                  color: accentColor, textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  ♪ {activeTrack?.label}
                </span>
              )}
            </div>

            {/* Track list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {AMBIENT_TRACKS.map(t => renderTrackRow(t, false))}
            </div>

            {/* Volume slider */}
            {isPlaying && (
              <div style={{
                padding: '12px 4px 0',
                borderTop: `1.5px solid ${trackBorder}`,
              }}>
                <span style={{
                  display: 'block', marginBottom: '10px',
                  fontFamily: 'Nunito, sans-serif', fontSize: '10px', fontWeight: 900,
                  textTransform: 'uppercase', letterSpacing: '0.18em', color: sheetTitle,
                }}>
                  Volume
                </span>
                {renderVolumeSlider()}
              </div>
            )}
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
        {/* First-visit hint tooltip */}
        <AnimatePresence>
          {showHint && !isPlaying && !isOpen && (
            <motion.div
              key="hint"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute', right: '60px', bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.78)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                padding: '6px 12px', borderRadius: '10px', whiteSpace: 'nowrap',
                fontFamily: 'Nunito, sans-serif', fontSize: '11px',
                fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: '#ffffff',
                pointerEvents: 'none',
              }}
            >
              Ambient Sounds
              <span style={{
                position: 'absolute', right: '-6px', top: '50%', transform: 'translateY(-50%)',
                width: 0, height: 0,
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderLeft: '6px solid rgba(0,0,0,0.78)',
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main floating button */}
        <motion.button
          ref={buttonRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleButtonClick}
          whileTap={{ scale: 0.86 }}
          aria-label={isPlaying ? `Stop ${activeTrack?.label}` : 'Ambient sounds'}
          style={{
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '50%',
            backgroundColor: isPlaying
              ? `${accentColor}22`
              : 'rgba(26,26,26,0.76)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: `2px solid ${isPlaying ? `${accentColor}88` : 'rgba(255,255,255,0.18)'}`,
            boxShadow: buttonGlow,
            cursor: 'pointer',
            transition: 'background-color 0.25s, border-color 0.25s, box-shadow 0.25s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* Headphone icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke={iconStroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'stroke 0.25s ease' }}>
            <path d="M3 14h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-6a9 9 0 0 1 18 0v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2" />
          </svg>

          {/* Animated pulse ring when playing */}
          {isPlaying && (
            <motion.span
              style={{
                position: 'absolute', inset: '-3px', borderRadius: '50%',
                border: `2px solid ${accentColor}`,
                pointerEvents: 'none',
              }}
              animate={{ scale: [1, 1.6], opacity: [0.55, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.button>

        {/* Track label under button when playing */}
        <AnimatePresence>
          {isPlaying && (
            <motion.span
              key={activeTrack?.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              style={{
                fontFamily: 'Nunito, sans-serif', fontSize: '9px',
                fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '0.14em', color: 'rgba(255,255,255,0.85)',
                whiteSpace: 'nowrap', textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              }}
            >
              {activeTrack?.label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

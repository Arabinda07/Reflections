import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ModalSheet } from './ModalSheet';
import { useAmbientAudio, AMBIENT_TRACKS } from '../../hooks/useAmbientAudio';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const WaveformBars: React.FC<{ color: string }> = ({ color }) => {
  const bars = [
    { h: [6, 14, 6], dur: 0.55 },
    { h: [14, 6, 14], dur: 0.7 },
    { h: [8, 18, 8], dur: 0.48 },
    { h: [16, 8, 16], dur: 0.62 },
  ];

  return (
    <div className="flex items-center gap-[3px] h-5">
      {bars.map((bar, index) => (
        <motion.div
          key={index}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: color }}
          animate={{ height: bar.h.map((value) => `${value}px`) }}
          transition={{
            duration: bar.dur,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
            delay: index * 0.08,
          }}
        />
      ))}
    </div>
  );
};

export const AmbientMusicButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const isMobile = useMediaQuery('(max-width: 639px)');
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const { isPlaying, activeTrack, playTrack, stopAll } = useAmbientAudio();

  useEffect(() => {
    const seen = sessionStorage.getItem('music_hint_shown');
    if (seen) return;

    const showTimer = setTimeout(() => setShowHint(true), 1800);
    const hideTimer = setTimeout(() => {
      setShowHint(false);
      sessionStorage.setItem('music_hint_shown', '1');
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || isMobile) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideButton = buttonRef.current?.contains(target);
      const insidePopup = popupRef.current?.contains(target);

      if (!insideButton && !insidePopup) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isMobile, isOpen]);

  const openPicker = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleTrackClick = useCallback(
    (track: (typeof AMBIENT_TRACKS)[0]) => {
      if (activeTrack?.id === track.id) {
        stopAll();
        return;
      }

      playTrack(track);
    },
    [activeTrack, playTrack, stopAll],
  );

  const handleButtonClick = () => {
    if (isPlaying) {
      stopAll();
      return;
    }

    if (isOpen) {
      setIsOpen(false);
      return;
    }

    openPicker();
  };

  const accentColor = activeTrack?.color ?? 'var(--green)';
  const buttonGlow = isPlaying
    ? `0 0 22px -4px color-mix(in oklch, ${accentColor} 42%, transparent)`
    : 'var(--floating-panel-shadow)';
  const iconStroke = isPlaying ? accentColor : isHovered ? 'var(--green)' : 'var(--gray-text)';

  const pickerBg = 'rgba(var(--panel-bg-rgb), 0.97)';
  const pickerBorder = 'var(--floating-panel-border)';
  const pickerShadow = 'var(--floating-panel-shadow-strong)';
  const trackHoverBg = 'oklch(from var(--green) l c h / 0.06)';
  const trackBg = 'rgba(var(--panel-bg-rgb), 0.76)';
  const trackBorder = 'oklch(from var(--border-color) l c h / 0.72)';

  const renderTrackRow = (track: (typeof AMBIENT_TRACKS)[0], compact = false) => {
    const isActive = activeTrack?.id === track.id;

    return (
      <button
        key={track.id}
        type="button"
        onClick={() => handleTrackClick(track)}
        className={`audio-track-row ${isActive ? 'audio-track-row--active' : ''} ${
          compact ? '' : 'min-h-[68px]'
        }`}
        style={
          {
            '--audio-track-border': isActive
              ? `color-mix(in oklch, ${track.color} 35%, transparent)`
              : compact
                ? pickerBorder
                : trackBorder,
            '--audio-track-bg': isActive
              ? `color-mix(in oklch, ${track.color} 12%, transparent)`
              : compact
                ? pickerBg
                : trackBg,
            '--audio-track-hover': isActive
              ? `color-mix(in oklch, ${track.color} 12%, transparent)`
              : compact
                ? trackHoverBg
                : 'rgba(var(--panel-bg-rgb), 0.92)',
            '--audio-track-active-border': `color-mix(in oklch, ${track.color} 35%, transparent)`,
            '--audio-track-active-bg': `color-mix(in oklch, ${track.color} 12%, transparent)`,
            '--audio-badge-bg': `color-mix(in oklch, ${track.color} 18%, transparent)`,
            '--audio-badge-border': `color-mix(in oklch, ${track.color} 26%, transparent)`,
          } as React.CSSProperties
        }
      >
        <span className="audio-track-badge" style={{ color: track.color }}>
          <span className={compact ? 'text-[15px]' : 'text-[19px]'}>{track.emoji}</span>
        </span>

        <span className="audio-track-copy">
          <span className="audio-track-title" style={{ color: isActive ? track.color : undefined }}>
            {track.label}
          </span>
        </span>

        {isActive ? (
          <WaveformBars color={track.color} />
        ) : (
          <span
            className="h-[7px] w-[7px] rounded-full shrink-0"
            style={{ backgroundColor: `color-mix(in oklch, ${track.color} 55%, transparent)` }}
          />
        )}
      </button>
    );
  };

  const desktopPopup =
    !isMobile && isOpen
      ? (
          <AnimatePresence>
            <motion.div
              ref={popupRef}
              key="desktop-audio-picker"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="audio-popup absolute bottom-[4.75rem] right-0 z-[200] min-w-[220px]"
              style={
                {
                  '--audio-picker-bg': pickerBg,
                  '--audio-picker-border': pickerBorder,
                  '--audio-picker-shadow': pickerShadow,
                } as React.CSSProperties
              }
            >
              <div className="audio-popup-header">
                <span className="audio-popup-label">Ambient sounds</span>
                {isPlaying ? (
                  <motion.div
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="h-[7px] w-[7px] rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                ) : null}
              </div>

              <div className="audio-track-list">{AMBIENT_TRACKS.map((track) => renderTrackRow(track, true))}</div>
            </motion.div>
          </AnimatePresence>
        )
      : null;

  return (
    <>
      {desktopPopup}

      <ModalSheet
        isOpen={isMobile && isOpen}
        onClose={() => setIsOpen(false)}
        title="Ambient sounds"
        description={
          isPlaying && activeTrack
            ? `Currently playing ${activeTrack.label.toLowerCase()}.`
            : 'Pick a background texture for your writing space.'
        }
        size="sm"
        bodyClassName="pt-2"
      >
        <div className="audio-track-list">
          {AMBIENT_TRACKS.map((track) => renderTrackRow(track, false))}
        </div>
      </ModalSheet>

      <div className="relative flex flex-col items-center gap-[5px]">
        <AnimatePresence>
          {showHint && !isPlaying && !isOpen ? (
            <motion.div
              key="audio-hint"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="audio-hint"
            >
              Ambient sounds
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          ref={buttonRef}
          type="button"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleButtonClick}
          whileTap={{ scale: 0.86 }}
          aria-label={isPlaying ? `Stop ${activeTrack?.label}` : 'Ambient sounds'}
          className="audio-floating-button"
          style={
            {
              '--audio-button-bg': isPlaying
                ? `color-mix(in oklch, ${accentColor} 18%, rgba(var(--panel-bg-rgb), 0.82))`
                : 'rgba(var(--panel-bg-rgb), 0.84)',
              '--audio-button-border': isPlaying
                ? `color-mix(in oklch, ${accentColor} 44%, transparent)`
                : 'var(--floating-panel-border)',
              '--audio-button-shadow': buttonGlow,
              '--audio-icon-stroke': iconStroke,
            } as React.CSSProperties
          }
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 14h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-6a9 9 0 0 1 18 0v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2" />
          </svg>

          {isPlaying ? (
            <motion.span
              className="pointer-events-none absolute inset-[-3px] rounded-full border-2"
              style={{ borderColor: accentColor }}
              animate={{ scale: [1, 1.6], opacity: [0.55, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            />
          ) : null}
        </motion.button>

        <AnimatePresence>
          {isPlaying && activeTrack ? (
            <motion.span
              key={activeTrack.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-[11px] font-bold text-white/85 whitespace-nowrap [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]"
            >
              {activeTrack.label}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
};

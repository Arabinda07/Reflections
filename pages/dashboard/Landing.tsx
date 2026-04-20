import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, DownloadSimple, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { RoutePath } from '../../types';
import { usePWAInstall } from '../../context/PWAInstallContext';

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};

const staggerLine = {
  hidden: { opacity: 0, y: 60, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.2, ease: [0.32, 0.72, 0, 1] } },
};

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden selection:bg-green/20 selection:text-green bg-body text-gray-text transition-colors duration-300">
      {/* Grain overlay utility */}
      <div className="grain-overlay" />

      {/* Full-bleed layered container */}
      <div className="min-h-[100dvh] w-full relative">

        {/* ── Left panel: content ── */}
        <div className="relative z-20 flex flex-col justify-between lg:justify-center gap-8 lg:gap-10 px-6 pt-20 pb-10 sm:px-12 sm:pt-28 sm:pb-14 lg:px-16 lg:py-16 xl:px-24 xl:py-20 lg:w-[60%] xl:w-[55%] pointer-events-none min-h-[100dvh]">

          {/* Hero headline — the one bold moment */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mt-4 mb-4 lg:my-0 flex flex-col pointer-events-auto max-w-5xl"
            style={{ lineHeight: 1.0 }}
          >
            <motion.span
              variants={staggerLine}
              className="font-display tracking-tighter text-gray-text"
              style={{
                fontSize: 'clamp(44px, 7.5vw, 132px)',
                lineHeight: 1.0,
              }}
            >
              Your mind,
            </motion.span>
            <motion.span
              variants={staggerLine}
              className="font-serif italic tracking-tight text-green"
              style={{
                fontSize: 'clamp(40px, 6.8vw, 118px)',
                lineHeight: 1.08,
              }}
            >
              beautifully
            </motion.span>
            <motion.span
              variants={staggerLine}
              className="font-display tracking-tighter text-gray-text"
              style={{
                fontSize: 'clamp(44px, 7.5vw, 132px)',
                lineHeight: 1.0,
              }}
            >
              organized.
            </motion.span>
          </motion.div>

          {/* Sub-copy */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1], delay: 0.5 }}
            className="font-serif text-[17px] sm:text-[18px] leading-relaxed max-w-[44ch] text-gray-light pointer-events-auto"
          >
            A private space for your thoughts. AI-powered reflections, mood
            tracking, and room to think clearly.
          </motion.p>

          {/* Primary CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1], delay: 0.6 }}
            className="pointer-events-auto mt-auto lg:mt-6"
          >

            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-8">
              <button
                onClick={() => navigate(RoutePath.SIGNUP)}
                className="group flex items-center gap-4 pl-6 pr-2 py-2 rounded-full bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 text-[16px] font-bold text-gray-text shadow-xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-2xl active:scale-[0.98]"
              >
                Begin writing
                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                  <ArrowRight size={20} weight="bold" />
                </div>
              </button>

              <button
                onClick={() => navigate(RoutePath.LOGIN)}
                className="text-[15px] font-medium text-gray-nav hover:text-gray-text transition-colors duration-300"
              >
                Sign in
              </button>
            </div>

            {/* Tertiary links */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <button
                onClick={() => navigate(RoutePath.FAQ)}
                className="text-[11px] font-bold tracking-[3.5px] uppercase text-gray-nav hover:text-gray-text transition-colors duration-300"
              >
                How it works
              </button>

              {canInstall && !isInstalled && (
                <motion.button
                  onClick={triggerInstall}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="flex items-center gap-1.5 text-[11px] font-bold tracking-[3.5px] uppercase text-gray-nav hover:text-gray-text transition-colors duration-300"
                >
                  <DownloadSimple size={14} weight="bold" />
                  Install app
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Background Video Layer ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="absolute inset-0 overflow-hidden pointer-events-none lg:pointer-events-auto"
        >
          {/* Mobile-only soft gradient mask */}
          <div className="absolute inset-x-0 top-0 h-[55%] z-10 lg:hidden bg-gradient-to-b from-body to-transparent pointer-events-none" aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-[50%] z-10 lg:hidden bg-gradient-to-r from-body to-transparent pointer-events-none" aria-hidden="true" />

          {/* Gradient fades — seamlessly dissolve video into bg-body (Desktop) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-10 pointer-events-none hidden lg:block"
            style={{ background: `linear-gradient(to right, var(--bg-color) 0%, var(--bg-color) 45%, transparent 65%)` }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-28 z-10 pointer-events-none hidden lg:block"
            style={{ background: `linear-gradient(to bottom, var(--bg-color), transparent)` }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-28 z-10 pointer-events-none hidden lg:block"
            style={{ background: `linear-gradient(to top, var(--bg-color), transparent)` }}
          />

          <video
            ref={videoRef}
            src="/assets/videos/landing_video.mp4"
            className="absolute inset-0 w-full h-full object-cover object-[52%_center] lg:object-center bg-body"
            style={{ opacity: 0.95 }}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="auto"
          />

          <button
            onClick={toggleMute}
            className="absolute bottom-6 right-6 z-20 p-2.5 rounded-full backdrop-blur-md bg-black/20 text-gray-light hover:text-white transition-all duration-300 pointer-events-auto"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <SpeakerSlash size={18} weight="bold" /> : <SpeakerHigh size={18} weight="bold" />}
          </button>
        </motion.div>

      </div>
    </div>
  );
};

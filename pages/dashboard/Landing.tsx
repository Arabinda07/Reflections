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
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
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
        <div className="relative z-20 flex min-h-[100dvh] flex-col justify-start px-6 pb-10 pt-[calc(env(safe-area-inset-top)+var(--header-height)+1rem)] sm:px-12 sm:pb-12 sm:pt-[calc(env(safe-area-inset-top)+var(--header-height)+1.5rem)] lg:justify-between lg:pt-[28vh] lg:pb-12 lg:px-16 xl:px-24 pointer-events-none">

          {/* Text section */}
          <div className="flex flex-col gap-5 sm:gap-6 lg:gap-8 lg:w-[60%] xl:w-[55%]">
            
            {/* Hero headline & Paragraph */}
            <div className="flex flex-col gap-5 sm:gap-6 lg:gap-8">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="pointer-events-auto flex max-w-[11ch] flex-col text-mk-display font-display tracking-[-0.03em] text-gray-text leading-[0.9] sm:max-w-[12ch] sm:leading-[0.94] lg:max-w-5xl lg:tracking-tight lg:leading-[0.98]"
              >
                <motion.span variants={staggerLine} style={{ willChange: 'transform, opacity, filter' }}>
                  Your mind,
                </motion.span>
                <motion.span variants={staggerLine} className="font-serif italic text-green" style={{ lineHeight: 1.1, willChange: 'transform, opacity, filter' }}>
                  beautifully
                </motion.span>
                <motion.span variants={staggerLine} style={{ willChange: 'transform, opacity, filter' }}>
                  organized.
                </motion.span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1], delay: 0.5 }}
                className="pointer-events-auto max-w-[33ch] font-serif text-[1rem] leading-[1.72] text-gray-text drop-shadow-[0_10px_30px_rgba(0,0,0,0.16)] sm:max-w-[38ch] sm:text-mk-body lg:max-w-[44ch]"
              >
                A private, distraction-free environment designed to help you untangle your mind and find clarity in the noise.
              </motion.p>
            </div>
            </div>

            {/* Primary CTAs — Grouped naturally below text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1], delay: 0.6 }}
              className="pointer-events-auto mt-8 flex flex-col items-start gap-x-8 gap-y-5 sm:mt-10 sm:flex-row sm:items-center sm:flex-wrap sm:gap-y-6 lg:mt-0"
            >
              <button
                onClick={() => navigate(RoutePath.SIGNUP)}
                className="group flex items-center justify-center sm:justify-start gap-3 text-[16px] sm:text-[18px] font-black text-white bg-green hover:bg-green-hover px-8 py-4 rounded-full shadow-[0_8px_24px_-8px_rgba(22,163,74,0.4)] transition-all duration-300 pointer-events-auto"
              >
                Begin writing
                <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform duration-500 ease-out-expo" />
              </button>

              <div className="flex items-center gap-6 sm:gap-8 flex-wrap px-2 sm:px-0">
                <button
                  onClick={() => navigate(RoutePath.LOGIN)}
                  className="text-[15px] font-medium text-gray-nav hover:text-gray-text transition-colors duration-300"
                >
                  Sign in
                </button>

                <div className="w-[1px] h-4 bg-border opacity-50" />

                <button
                  onClick={() => navigate(RoutePath.FAQ)}
                  className="label-caps hover:text-gray-text transition-colors duration-300"
                >
                  How it works
                </button>

                {canInstall && !isInstalled && (
                  <>
                    <div className="w-[1px] h-4 bg-border opacity-50 hidden sm:block" />
                    <motion.button
                      onClick={triggerInstall}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2, duration: 0.5 }}
                      className="flex items-center gap-1.5 label-caps hover:text-gray-text transition-colors duration-300"
                    >
                      <DownloadSimple size={14} weight="light" />
                      Install app
                    </motion.button>
                  </>
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
          {/* Subtle responsive masks */}
          <div
            className="absolute inset-0 z-10 pointer-events-none lg:hidden"
            style={{
              background: `linear-gradient(to bottom, var(--bg-color) 0%, rgb(var(--panel-bg-rgb) / 0.92) 18%, transparent 46%),
                           linear-gradient(to right, var(--bg-color) 0%, rgb(var(--panel-bg-rgb) / 0.78) 34%, transparent 72%)`,
            }}
          />
          <div 
            className="absolute inset-0 z-10 hidden lg:block pointer-events-none"
            style={{ 
              background: `linear-gradient(to right, var(--bg-color) 0%, var(--bg-color) 40%, transparent 80%),
                           linear-gradient(to bottom, var(--bg-color) 0%, transparent 15%, transparent 85%, var(--bg-color) 100%)` 
            }}
          />

          <video
            ref={videoRef}
            src="/assets/videos/landing_video.mp4"
            poster="/assets/videos/landing_video.png"
            className="absolute inset-0 h-full w-full object-cover object-[70%_center] sm:object-[64%_center] lg:object-center bg-body"
            style={{ opacity: 0.9 }}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
          />

          <button
            onClick={toggleMute}
            className="absolute bottom-10 right-6 z-30 rounded-full border border-white/15 bg-[rgba(var(--panel-bg-rgb),0.42)] p-3 text-white backdrop-blur-md transition-all duration-300 hover:bg-[rgba(var(--panel-bg-rgb),0.58)] pointer-events-auto lg:bottom-12 lg:right-16"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <SpeakerSlash size={20} weight="bold" /> : <SpeakerHigh size={20} weight="bold" />}
          </button>
        </motion.div>

      </div>
    </div>
  );
};

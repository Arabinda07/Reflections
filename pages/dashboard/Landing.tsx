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
        <div className="relative z-20 flex flex-col justify-between h-[100dvh] px-6 pt-20 pb-12 sm:px-12 sm:pt-28 sm:pb-12 lg:px-16 lg:pt-32 lg:pb-12 xl:px-24 pointer-events-none">

          {/* Hero headline — the one bold moment */}
          <div className="flex flex-col gap-8 lg:gap-12 lg:w-[60%] xl:w-[55%]">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="flex flex-col pointer-events-auto max-w-5xl text-mk-display font-display tracking-tight text-gray-text"
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
              className="text-mk-body font-serif text-gray-text drop-shadow-md max-w-[44ch] pointer-events-auto"
            >
              A private, distraction-free environment designed to help you untangle your mind and find clarity in the noise.
            </motion.p>
          </div>

          {/* Primary CTAs — Aligned to bottom horizontally */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1], delay: 0.6 }}
            className="pointer-events-auto flex flex-wrap items-center gap-x-8 gap-y-6"
          >
            <button
              onClick={() => navigate(RoutePath.SIGNUP)}
              className="group flex items-center gap-3 text-[18px] font-black text-gray-text hover:text-green transition-all duration-300"
            >
              Begin writing
              <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform duration-500 ease-out-expo" />
            </button>

            <button
              onClick={() => navigate(RoutePath.LOGIN)}
              className="text-[15px] font-medium text-gray-nav hover:text-gray-text transition-colors duration-300"
            >
              Sign in
            </button>

            <div className="w-[1px] h-4 bg-border hidden sm:block opacity-50" />

            <button
              onClick={() => navigate(RoutePath.FAQ)}
              className="label-caps hover:text-gray-text transition-colors duration-300"
            >
              How it works
            </button>

            {canInstall && !isInstalled && (
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
            )}
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
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-body via-body/60 to-transparent lg:hidden" />
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
            className="absolute inset-0 w-full h-full object-cover object-[52%_center] lg:object-center bg-body"
            style={{ opacity: 0.9 }}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
          />

          <button
            onClick={toggleMute}
            className="absolute bottom-10 lg:bottom-12 right-6 lg:right-16 z-30 p-3 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-all duration-300 pointer-events-auto"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <SpeakerSlash size={20} weight="bold" /> : <SpeakerHigh size={20} weight="bold" />}
          </button>
        </motion.div>

      </div>
    </div>
  );
};

import { ArrowRight, DownloadSimple, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePWAInstall } from '../../context/PWAInstallContext';
import { RoutePath } from '../../types';

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
      {/* Full-bleed layered container */}
      <div className="min-h-[100dvh] w-full relative">

        {/* ── Left panel: content ── */}
        <div className="relative z-20 flex min-h-[100dvh] flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+1.75rem)] pt-[calc(env(safe-area-inset-top)+var(--header-height)+1.5rem)] sm:px-12 sm:pb-[calc(env(safe-area-inset-bottom)+2rem)] sm:pt-[calc(env(safe-area-inset-top)+var(--header-height)+2rem)] lg:justify-between lg:pt-[28vh] lg:pb-12 lg:px-16 xl:px-24 pointer-events-none">

          <div className="flex flex-col gap-6 lg:w-[60%] lg:gap-8 xl:w-[55%]">
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
              className="pointer-events-auto max-w-[33ch] font-serif text-[1rem] leading-[1.72] text-gray-text sm:max-w-[38ch] sm:text-mk-body lg:max-w-[44ch]"
            >
              A private place to put words down, notice what returns, and leave the noise outside.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1], delay: 0.6 }}
            className="pointer-events-auto mt-auto flex w-full max-w-[26rem] flex-col items-start gap-5 sm:max-w-none sm:flex-row sm:items-end sm:justify-between sm:gap-6 lg:mt-0 lg:w-[60%] xl:w-[55%]"
          >
            <button
              onClick={() => navigate(RoutePath.SIGNUP)}
              className="group flex w-fit items-center justify-start gap-3 rounded-[var(--radius-control)] border border-green/20 bg-green px-8 py-4 text-[16px] font-black text-white shadow-[0_18px_40px_-28px_rgba(22,163,74,0.45)] transition-all duration-300 hover:bg-green-hover sm:w-auto sm:justify-start sm:text-[18px]"
            >
              Begin writing
              <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform duration-500 ease-out-expo" />
            </button>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 px-2 sm:justify-end sm:px-0">
              <button
                onClick={() => navigate(RoutePath.LOGIN)}
                className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-3 text-[15px] font-medium text-gray-nav transition-colors duration-300 hover:text-gray-text"
              >
                Sign in
              </button>

              <div className="h-4 w-[1px] bg-border opacity-50" />

              <button
                onClick={() => navigate(RoutePath.FAQ)}
                className="label-caps inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-3 transition-colors duration-300 hover:text-gray-text"
              >
                How it works
              </button>

              {canInstall && !isInstalled && (
                <>
                  <div className="hidden h-4 w-[1px] bg-border opacity-50 sm:block" />
                  <motion.button
                    onClick={triggerInstall}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    className="label-caps inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-control)] px-3 transition-colors duration-300 hover:text-gray-text"
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
          <div className="video-mask video-mask--mobile lg:hidden" />
          <div className="video-mask video-mask--desktop hidden lg:block" />

          <video
            ref={videoRef}
            poster="/assets/videos/landing_video.png"
            className="absolute inset-0 h-full w-full object-cover object-[48%_center] bg-body opacity-90 sm:object-[64%_center] lg:object-center"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
          >
            <source src="/assets/videos/landing_video.webm" type="video/webm" />
            <source src="/assets/videos/landing_video.mp4" type="video/mp4" />
          </video>

          <button
            onClick={toggleMute}
            className="surface-floating surface-floating--media absolute bottom-10 right-6 z-30 rounded-[var(--radius-control)] p-3 pointer-events-auto lg:bottom-12 lg:right-16"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <SpeakerSlash size={20} weight="bold" /> : <SpeakerHigh size={20} weight="bold" />}
          </button>
        </motion.div>

      </div>
    </div>
  );
};

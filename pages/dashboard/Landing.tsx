import { ArrowRight, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};

const staggerLine = {
  hidden: { opacity: 0, y: 60 },
  show: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
};

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden selection:bg-green/20 selection:text-green bg-body text-gray-text transition-colors duration-300">
      {/* Full-bleed layered container */}
      <div className="min-h-[100dvh] w-full relative overflow-hidden">

        {/* ── Left panel: content ── */}
        <div className="relative z-20 flex min-h-[100dvh] flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+1.75rem)] pt-[calc(env(safe-area-inset-top)+var(--header-height)+1.5rem)] sm:px-12 sm:pt-[calc(env(safe-area-inset-top)+var(--header-height)+2rem)] lg:justify-between lg:pt-[28vh] lg:pb-12 lg:px-16 xl:px-24 pointer-events-none">

          <div className="flex flex-col gap-6 lg:w-[60%] lg:gap-8 xl:w-[55%]">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="pointer-events-auto flex max-w-[11ch] flex-col text-mk-display font-display tracking-[-0.04em] text-gray-text leading-[0.92] sm:max-w-[12ch] sm:leading-[0.94] lg:max-w-5xl lg:leading-[0.96] text-balance"
            >
              <motion.span variants={staggerLine} style={{ willChange: 'transform, opacity' }}>
                Your mind,
              </motion.span>
              <motion.span variants={staggerLine} className="font-serif italic text-green" style={{ lineHeight: 1.1, willChange: 'transform, opacity' }}>
                beautifully
              </motion.span>
              <motion.span variants={staggerLine} style={{ willChange: 'transform, opacity' }}>
                organized.
              </motion.span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1], delay: 0.5 }}
              className="pointer-events-auto max-w-[33ch] font-serif text-[1rem] leading-relaxed text-gray-text sm:max-w-[38ch] sm:text-mk-body lg:max-w-[44ch] tracking-tight"
            >
              A private place to put words down, notice what returns, and leave the noise outside.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
            className="pointer-events-auto mt-auto flex w-full flex-col items-start gap-8 sm:max-w-none sm:flex-row sm:items-center sm:justify-between lg:mt-0"
          >
            <Button
              variant="primary"
              onClick={() => navigate(RoutePath.SIGNUP)}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="group h-16 w-auto px-10 font-editor text-[19px] font-bold shadow-2xl shadow-green/30 hover:shadow-green/40 hover:bg-green-hover"
              aria-label="Begin writing"
            >
              Begin writing
              <ArrowRight size={22} className="ml-3 group-hover:translate-x-1.5 transition-transform duration-500 ease-out-expo" />
            </Button>

            <div className="flex w-full items-center justify-between sm:w-auto sm:gap-x-10 lg:gap-x-12 mt-4 sm:mt-0">
              <div className="flex items-center gap-x-8 sm:gap-x-10">
                <Button
                  variant="ghost"
                  onClick={() => navigate(RoutePath.LOGIN)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="h-11 px-0 text-[15px] font-medium text-gray-text hover:text-green transition-colors"
                >
                  Sign in
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => navigate(RoutePath.FAQ)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="h-11 px-0 text-[15px] font-medium text-gray-text hover:text-green transition-colors"
                >
                  How it works
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={toggleMute}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9, rotate: -8 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="surface-floating surface-floating--media h-11 min-h-11 w-11 min-w-11 !px-0 rounded-2xl !text-gray-nav hover:!text-green hover:border-green/40 transition-all duration-300 group"
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <SpeakerSlash size={20} weight="bold" /> : <SpeakerHigh size={20} weight="bold" />}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      >
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
      </motion.div>
    </main>
  );
};

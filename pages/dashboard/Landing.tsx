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
  hidden: { opacity: 0, y: 60, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
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
    <div className="relative min-h-[100dvh] overflow-x-hidden selection:bg-green/20 selection:text-green bg-body text-gray-text transition-colors duration-300">
      {/* Full-bleed layered container */}
      <div className="min-h-[100dvh] w-full relative overflow-hidden">

        {/* ── Left panel: content ── */}
        <div className="relative z-20 flex min-h-[100dvh] flex-col px-6 pb-10 pt-[calc(env(safe-area-inset-top)+var(--header-height)+1.5rem)] sm:px-12 sm:pb-10 sm:pt-[calc(env(safe-area-inset-top)+var(--header-height)+2rem)] lg:justify-between lg:pt-[28vh] lg:pb-12 lg:px-16 xl:px-24 pointer-events-none">

          <div className="flex flex-col gap-6 lg:w-[60%] lg:gap-8 xl:w-[55%]">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="pointer-events-auto flex max-w-[11ch] flex-col text-mk-display font-display tracking-[-0.04em] text-gray-text leading-[0.92] sm:max-w-[12ch] sm:leading-[0.94] lg:max-w-5xl lg:leading-[0.96] text-balance"
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
              className="pointer-events-auto max-w-[33ch] font-serif text-[1rem] leading-relaxed text-gray-text sm:max-w-[38ch] sm:text-mk-body lg:max-w-[44ch] tracking-tight"
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
            <Button
              variant="primary"
              onClick={() => navigate(RoutePath.SIGNUP)}
              className="group h-auto py-3.5 px-6 text-[18px] font-black sm:w-auto"
              aria-label="Begin writing"
            >
              Begin writing
              <ArrowRight size={22} className="ml-3 group-hover:translate-x-1.5 transition-transform duration-500 ease-out-expo" />
            </Button>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-2 sm:justify-end sm:px-0">
              <Button
                variant="ghost"
                onClick={() => navigate(RoutePath.LOGIN)}
                className="h-11 px-0 text-[15px] font-bold text-gray-text hover:text-green"
              >
                Sign in
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate(RoutePath.FAQ)}
                className="label-caps h-11 px-0 text-gray-text hover:text-green"
              >
                How it works
              </Button>
            </div>
          </motion.div>

          {/* Mute Button Extracted to Content Layer */}
          <Button
            variant="secondary"
            onClick={toggleMute}
            className="pointer-events-auto absolute bottom-6 right-6 z-50 h-11 w-11 !px-0 rounded-[var(--radius-control)] border-[1.5px] border-border bg-surface text-gray-nav shadow-sm hover:text-green hover:border-green/40 lg:right-16 lg:bottom-12 group"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <SpeakerSlash size={20} weight="bold" /> : <SpeakerHigh size={20} weight="bold" />}
          </Button>
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
    </div>
  );
};

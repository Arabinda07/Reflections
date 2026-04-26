import { ArrowRight, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoutePath } from '../../types';

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};

const staggerLine = {
  hidden: { opacity: 0, y: 60, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
};

const landingAnswers = [
  {
    title: 'What is Reflections?',
    body:
      'Reflections is a private writing-first wellness journal for saving notes, naming moods, and returning to patterns when you are ready.',
  },
  {
    title: 'Who is Reflections for?',
    body:
      'It is for people who want a calm place to think in writing without streaks, public sharing, pressure loops, or automatic AI interruptions.',
  },
  {
    title: 'Why writing first?',
    body:
      'Writing is the main practice. Optional AI support and Life Wiki refreshes stay out of the way until you ask for them.',
  },
];

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
              className="pointer-events-auto flex max-w-[11ch] flex-col text-mk-display font-display tracking-[-0.04em] text-gray-text leading-[0.92] sm:max-w-[12ch] sm:leading-[0.94] lg:max-w-5xl lg:leading-[0.96]"
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
            <button
              onClick={() => navigate(RoutePath.SIGNUP)}
              className="group flex min-h-11 w-fit items-center justify-start gap-3 rounded-[var(--radius-control)] border border-green/20 bg-green px-8 py-4 text-[16px] font-black text-white shadow-[0_12px_32px_-12px_rgba(22,163,74,0.35)] transition-all duration-300 hover:bg-green-hover hover:shadow-lg active:scale-95 sm:w-auto sm:justify-start sm:text-[18px]"
              aria-label="Begin writing"
            >
              Begin writing
              <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform duration-500 ease-out-expo" />
            </button>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-2 sm:justify-end sm:px-0">
              <button
                onClick={() => navigate(RoutePath.LOGIN)}
                className="inline-flex min-h-11 items-center text-[15px] font-bold text-gray-text transition-all duration-300 hover:text-green active:scale-95"
              >
                Sign in
              </button>

              <button
                onClick={() => navigate(RoutePath.FAQ)}
                className="label-caps inline-flex min-h-11 items-center text-gray-text transition-all duration-300 hover:text-green active:scale-95"
              >
                How it works
              </button>

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
            className="surface-floating surface-floating--media absolute bottom-10 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-gray-text transition-all duration-300 hover:shadow-sm active:scale-95 lg:bottom-12 lg:right-16"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <SpeakerSlash size={20} weight="bold" /> : <SpeakerHigh size={20} weight="bold" />}
          </button>
        </motion.div>

      </div>

      <section
        aria-labelledby="landing-product-answers"
        className="relative z-20 border-t border-border bg-body px-6 py-16 sm:px-12 lg:px-16 xl:px-24"
      >
        <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-start">
          <div className="space-y-5">
            <p className="label-caps text-green">Last updated April 26, 2026</p>
            <h2 id="landing-product-answers" className="text-mk-h2 font-display leading-tight text-gray-text">
              A quieter place to understand what keeps returning.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {landingAnswers.map((answer) => (
              <article key={answer.title} className="border-t border-border pt-6">
                <h2 className="mb-4 text-[22px] font-display leading-tight text-gray-text">
                  {answer.title}
                </h2>
                <p className="font-serif text-[16px] leading-relaxed text-gray-light">
                  {answer.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

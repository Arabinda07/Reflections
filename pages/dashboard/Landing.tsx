import { ArrowRight, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { RoutePath } from '../../types';

export const Landing: React.FC = () => {
  useDocumentMeta({
    title: 'Reflections – Private Journal for Notes, Mood & Reflection',
    description: 'A private journal app for writing notes, naming moods, tagging patterns, and using optional AI support only when you ask. No streaks, no pressure.',
    path: '/',
  });
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [shouldLoadHeroVideo, setShouldLoadHeroVideo] = useState(false);
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);

  useEffect(() => {
    if (shouldLoadHeroVideo) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = Boolean(
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
    );

    if (prefersReducedMotion || saveData) return;

    const loadVideo = () => setShouldLoadHeroVideo(true);
    let idleId: number | undefined;
    let timerId: number | undefined;

    if (window.requestIdleCallback) {
      idleId = window.requestIdleCallback(loadVideo, { timeout: 1600 });
    } else {
      timerId = window.setTimeout(loadVideo, 1200);
    }

    return () => {
      if (idleId !== undefined) {
        window.cancelIdleCallback(idleId);
      }

      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
    };
  }, [shouldLoadHeroVideo]);

  const toggleMute = () => {
    if (!videoRef.current) {
      setShouldLoadHeroVideo(true);
      setIsMuted(false);
      return;
    }

    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div role="region" aria-label="Welcome" className="surface-scope-sage page-wash relative min-h-[100dvh] overflow-x-hidden selection:bg-green/20 selection:text-green bg-body text-gray-text">
      {/* Full-bleed layered container */}
      <div className="relative isolate min-h-[100dvh] w-full overflow-hidden bg-body">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="video-mask video-mask--mobile lg:hidden" />
          <div className="video-mask video-mask--desktop hidden lg:block" />
          <img
            src="/assets/videos/landing_video.png"
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className={`absolute inset-0 h-full min-h-full w-full min-w-full transform-gpu object-cover object-[48%_center] sm:object-[64%_center] lg:object-center transition-opacity duration-700 ease-out-expo ${isHeroVideoReady ? 'opacity-0' : 'opacity-100'}`}
            style={{ willChange: 'opacity' }}
          />

          {shouldLoadHeroVideo ? (
            <video
              ref={videoRef}
              poster="/assets/videos/landing_video.png"
              aria-hidden="true"
              className={`absolute inset-0 h-full min-h-full w-full min-w-full transform-gpu object-cover object-[48%_center] bg-transparent transition-opacity duration-700 ease-out-expo motion-reduce:transition-none sm:object-[64%_center] lg:object-center ${isHeroVideoReady ? 'opacity-90' : 'opacity-0'}`}
              style={{ willChange: 'opacity' }}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              preload="metadata"
              onCanPlay={() => setIsHeroVideoReady(true)}
              onPlaying={() => setIsHeroVideoReady(true)}
            >
              <source src="/assets/videos/landing_video.webm" type="video/webm" />
              <source src="/assets/videos/landing_video.mp4" type="video/mp4" />
            </video>
          ) : null}
        </div>

        {/* ── Left panel: content ── */}
        <div className="relative z-20 flex min-h-[100dvh] flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+1.75rem)] pt-[calc(env(safe-area-inset-top)+var(--header-height)+1.5rem)] sm:px-12 sm:pt-[calc(env(safe-area-inset-top)+var(--header-height)+2rem)] lg:justify-between lg:pt-[28vh] lg:pb-12 lg:px-16 xl:px-24 pointer-events-none">

          <div className="flex flex-col gap-6 lg:w-[60%] lg:gap-8 xl:w-[55%]">
            <h1
              aria-label="Your mind, beautifully organized"
              className="pointer-events-auto flex max-w-[11ch] flex-col text-mk-display font-display font-extrabold tracking-normal text-gray-text leading-[0.92] sm:max-w-[12ch] sm:leading-[0.94] lg:max-w-5xl lg:leading-[0.96]"
            >
              <span>
                Your mind,
              </span>
              <span className="font-serif italic font-normal text-green" style={{ lineHeight: 1.1 }}>
                beautifully
              </span>
              <span>
                organized
              </span>
            </h1>

            <p
              className="pointer-events-auto max-w-[26ch] sm:max-w-[32ch] lg:max-w-[40ch] font-sans text-base font-medium leading-relaxed text-gray-text sm:text-lg tracking-normal"
            >
              A private journal. Write what's on your mind, notice the patterns, and keep it to yourself
            </p>
          </div>

          <div
            className="pointer-events-auto mt-auto flex w-full flex-col items-start gap-8 sm:max-w-none sm:flex-row sm:items-center sm:justify-between lg:mt-0"
          >
            <Button
              variant="primary"
              onClick={() => navigate(RoutePath.SIGNUP)}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="group h-16 w-auto px-10 font-sans text-[19px] font-bold tracking-normal"
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
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="h-11 px-0 text-[15px] font-medium text-gray-text hover:text-green transition-colors"
                >
                  Sign in
                </Button>

                <a
                  href={RoutePath.FAQ}
                  className="inline-flex h-11 min-w-0 items-center justify-center whitespace-nowrap px-0 text-[15px] font-medium text-gray-text transition-colors duration-300 ease-out-expo hover:text-green focus:outline-none"
                >
                  How it works
                </a>
              </div>

              <Button
                variant="outline"
                onClick={toggleMute}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9, rotate: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="surface-floating surface-floating--media h-11 min-h-11 w-11 min-w-11 !px-0 rounded-2xl !text-gray-nav hover:!text-green hover:border-green/40 transition-[color,border-color] duration-300 group"
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <SpeakerSlash size={20} weight="regular" /> : <SpeakerHigh size={20} weight="regular" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

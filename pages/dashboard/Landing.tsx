import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { RoutePath } from '../../types';

type TinyIconProps = {
  className?: string;
};

const ArrowRightIcon: React.FC<TinyIconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M5 12h13m-5-5 5 5-5 5"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SpeakerHighIcon: React.FC<TinyIconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M4 10v4h4l5 4V6L8 10H4Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.5 8.5a5 5 0 0 1 0 7M18.8 6.2a8.2 8.2 0 0 1 0 11.6"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

const SpeakerMutedIcon: React.FC<TinyIconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M4 10v4h4l5 4V6L8 10H4Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m17 10 4 4m0-4-4 4"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

const scheduleIdleTask = (callback: () => void, timeout = 2400) => {
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(callback, { timeout });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(callback, timeout);
  return () => window.clearTimeout(handle);
};

import { hasStoredAuthSessionHint } from '../../src/utils/authHints';

export const Landing: React.FC = () => {
  useDocumentMeta({
    title: 'Reflections - Private Journal for Notes, Mood & Reflection',
    description: 'A private journal for writing notes, naming moods, and noticing patterns. AI runs only when you ask. No streaks, no pressure.',
    path: '/',
  });
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [shouldLoadHeroVideo, setShouldLoadHeroVideo] = useState(false);
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches && videoRef.current) {
        videoRef.current.pause();
      } else if (!e.matches && videoRef.current && isHeroVideoReady) {
        videoRef.current.play().catch(() => {});
      }
    };
    
    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, [isHeroVideoReady]);

  useEffect(() => {
    if (shouldLoadHeroVideo) return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const saveData = Boolean(
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
    );

    if (saveData || reducedMotionQuery.matches) return;

    let cancelVideoLoad: (() => void) | undefined;
    const videoDelay = window.setTimeout(() => {
      cancelVideoLoad = scheduleIdleTask(() => setShouldLoadHeroVideo(true), 1800);
    }, 3200);

    return () => {
      window.clearTimeout(videoDelay);
      cancelVideoLoad?.();
    };
  }, [shouldLoadHeroVideo]);

  useEffect(() => {
    if (!hasStoredAuthSessionHint()) {
      return;
    }

    let isActive = true;

    const redirectAuthenticatedUser = async () => {
      try {
        const { supabase } = await import('../../src/supabaseClient');
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (isActive && session) {
          navigate(RoutePath.DASHBOARD, { replace: true });
        }
      } catch (error) {
        console.warn('Could not check the existing auth session from landing.', error);
      }
    };

    const cancelIdleCheck = scheduleIdleTask(redirectAuthenticatedUser, 5200);

    return () => {
      isActive = false;
      cancelIdleCheck();
    };
  }, [navigate]);

  const toggleMute = () => {
    const nextMuted = !isMuted;

    setShouldLoadHeroVideo(true);
    setIsMuted(nextMuted);

    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.muted = nextMuted;

    if (!nextMuted && video.paused) {
      void video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
      });
    }
  };

  return (
    <main aria-label="Welcome" className="surface-scope-sage page-wash relative min-h-[100dvh] overflow-x-hidden selection:bg-green/20 selection:text-green bg-body text-gray-text">
      <div className="relative isolate min-h-[100dvh] w-full overflow-hidden bg-body">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="video-mask video-mask--mobile lg:hidden" />
          <div className="video-mask video-mask--desktop hidden lg:block" />
          <picture>
            <source srcSet="/assets/videos/landing_video.webp" type="image/webp" media="(min-width: 1024px)" />
            <source srcSet="/assets/videos/landing_video_mobile.webp" type="image/webp" media="(max-width: 1023px)" />
            <img
              src="/assets/videos/landing_video_mobile.webp"
              alt=""
              aria-hidden="true"
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className={`absolute inset-0 h-full min-h-full w-full min-w-full transform-gpu object-cover object-[48%_center] sm:object-[64%_center] lg:object-center transition-opacity duration-700 ease-out-expo ${isHeroVideoReady ? 'opacity-0' : 'opacity-100'}`}
            />
          </picture>

          {shouldLoadHeroVideo ? (
            <video
              ref={videoRef}
              aria-hidden="true"
              className={`absolute inset-0 h-full min-h-full w-full min-w-full transform-gpu object-cover object-[48%_center] bg-transparent transition-opacity duration-700 ease-out-expo motion-reduce:transition-none sm:object-[64%_center] lg:object-center ${isHeroVideoReady ? 'opacity-90' : 'opacity-0'}`}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              preload="metadata"
              onCanPlay={(event) => {
                setIsHeroVideoReady(true);
                if (!isMuted) {
                  void event.currentTarget.play().catch(() => {
                    event.currentTarget.muted = true;
                    setIsMuted(true);
                  });
                }
              }}
              onPlaying={() => setIsHeroVideoReady(true)}
            >
              <source src="/assets/videos/landing_video_mobile.webm" type="video/webm" media="(max-width: 1023px)" />
              <source src="/assets/videos/landing_video_mobile.mp4" type="video/mp4" media="(max-width: 1023px)" />
              <source src="/assets/videos/landing_video.webm" type="video/webm" media="(min-width: 1024px)" />
            </video>
          ) : null}
        </div>

        <div className="relative z-20 flex min-h-[100dvh] flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+1.75rem)] pt-[calc(env(safe-area-inset-top)+var(--header-height)+1.5rem)] sm:px-12 sm:pt-[calc(env(safe-area-inset-top)+var(--header-height)+2rem)] lg:justify-between lg:pt-[28vh] lg:pb-12 lg:px-16 xl:px-24 pointer-events-none">
          <div className="flex flex-col gap-6 lg:w-[60%] lg:gap-8 xl:w-[55%]">
            <h1
              aria-label="Your mind beautifully organized"
              className="pointer-events-auto flex max-w-[11ch] flex-col text-mk-display font-display font-extrabold tracking-normal text-gray-text leading-[1.05] sm:leading-[1.0] lg:max-w-5xl lg:leading-[0.96]"
            >
              <span>Your mind</span>
              <span className="font-serif italic font-normal text-green" style={{ lineHeight: 1.15 }}>
                beautifully
              </span>
              <span>organized</span>
            </h1>

            <p className="pointer-events-auto max-w-[26ch] sm:max-w-[32ch] lg:max-w-[40ch] font-sans text-base font-normal leading-relaxed text-gray-text/85 sm:text-lg tracking-[-0.01em]">
              A private journal. Write what's on your mind, notice the patterns, and keep it to yourself
            </p>
          </div>

          <div className="pointer-events-auto mt-auto flex w-full flex-col items-start gap-8 sm:max-w-none sm:flex-row sm:items-center sm:justify-between lg:mt-0">
            <button
              type="button"
              onClick={() => navigate(RoutePath.SIGNUP)}
              className="group relative inline-flex h-16 min-w-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-control)] bg-green px-10 font-sans text-btn-lg font-bold text-white shadow-[0_12px_28px_-10px_var(--green-shadow)] transition-[transform,box-shadow,background-color] duration-300 ease-out-expo hover:scale-[1.03] hover:bg-green-hover hover:shadow-[0_16px_36px_-10px_var(--green-shadow)] active:scale-[0.97] motion-reduce:transition-none"
              aria-label="Begin writing"
            >
              Begin writing
              <ArrowRightIcon className="ml-3 h-5 w-5 text-white/80 transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5" />
            </button>

            <div className="mt-4 flex w-full items-center justify-between gap-5 sm:mt-0 sm:w-auto sm:gap-x-10 lg:gap-x-12">
              <div className="flex min-w-0 items-center gap-x-8 sm:gap-x-10">
                <button
                  type="button"
                  onClick={() => navigate(RoutePath.LOGIN)}
                  className="inline-flex h-11 min-h-11 min-w-0 items-center justify-center whitespace-nowrap px-1 text-btn-sm font-bold text-gray-nav transition-all duration-300 ease-out-expo hover:-translate-y-px hover:text-green active:translate-y-px"
                >
                  Sign in
                </button>

                <a
                  href={RoutePath.FAQ}
                  className="inline-flex h-11 min-h-11 min-w-0 items-center justify-center whitespace-nowrap px-1 text-btn-sm font-bold text-gray-nav transition-all duration-300 ease-out-expo hover:-translate-y-px hover:text-green active:translate-y-px"
                >
                  How it works
                </a>
              </div>

              <button
                type="button"
                onClick={toggleMute}
                className="surface-floating surface-floating--media flex h-12 min-h-12 w-12 min-w-12 shrink-0 items-center justify-center rounded-2xl text-gray-nav transition-[color,border-color,transform] duration-300 ease-out-expo hover:scale-[1.03] hover:border-green/40 hover:text-green active:scale-95 motion-reduce:transition-none"
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? (
                  <SpeakerMutedIcon className="h-5 w-5" />
                ) : (
                  <SpeakerHighIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

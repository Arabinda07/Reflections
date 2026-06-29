import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { PUBLIC_SEO_COPY } from '../../src/config/publicSeoCopy.js';
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

const HOME_SEO = PUBLIC_SEO_COPY.home;

export const Landing: React.FC = () => {
  useDocumentMeta({
    title: HOME_SEO.title,
    description: HOME_SEO.description,
    path: HOME_SEO.path,
  });
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [shouldLoadHeroVideo, setShouldLoadHeroVideo] = useState(false);
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);

  const shouldReduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    if (!shouldReduceMotion) return;
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (shouldLoadHeroVideo) return;

    const saveData = Boolean(
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
    );

    if (saveData || shouldReduceMotion) return;

    let cancelVideoLoad: (() => void) | undefined;
    const videoDelay = window.setTimeout(() => {
      cancelVideoLoad = scheduleIdleTask(() => setShouldLoadHeroVideo(true), 3000);
    }, 9000);

    return () => {
      window.clearTimeout(videoDelay);
      cancelVideoLoad?.();
    };
  }, [shouldLoadHeroVideo, shouldReduceMotion]);

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

  const handleAppRouteNavigation = (event: React.MouseEvent<HTMLAnchorElement>, href: RoutePath) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    navigate(href);
  };

  return (
    <div role="region" aria-label="Welcome" className="surface-scope-sage page-wash relative min-h-[100dvh] overflow-x-hidden selection:bg-green/20 selection:text-green bg-body text-gray-text">
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
              className={`absolute inset-0 h-full min-h-full w-full min-w-full transform-gpu object-cover object-[48%_center] bg-transparent transition-opacity duration-700 ease-out-expo motion-reduce:transition-none sm:object-[64%_center] lg:object-center ${isHeroVideoReady ? 'opacity-72' : 'opacity-0'}`}
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
              aria-label={HOME_SEO.heroAriaLabel}
              className="pointer-events-auto flex max-w-[11ch] flex-col text-mk-display font-display font-extrabold tracking-normal text-gray-text leading-[1.05] sm:leading-[1.0] lg:max-w-5xl lg:leading-[0.96]"
            >
              <span>{HOME_SEO.heroLines[0]}</span>
              <span className="font-serif italic font-normal text-green leading-[1.15]">
                {HOME_SEO.heroLines[1]}
              </span>
              <span>{HOME_SEO.heroLines[2]}</span>
            </h1>

            <p className="pointer-events-auto max-w-[26ch] sm:max-w-[32ch] lg:max-w-[40ch] font-sans text-base font-normal leading-relaxed text-gray-text/85 sm:text-lg">
              {HOME_SEO.heroIntro.split(/(\bFree\b)/).map((part, index) =>
                part === 'Free' ? <em key={index} className="font-serif italic">{part}</em> : part,
              )}
            </p>
          </div>

          <div className="pointer-events-auto mt-auto flex w-full flex-col items-start gap-4 sm:max-w-none sm:flex-row sm:items-center sm:justify-between sm:gap-8 lg:mt-0">
            <div className="flex flex-col items-start gap-2.5">
              <button
                type="button"
                onClick={() => navigate(RoutePath.SIGNUP)}
                className="group relative inline-flex h-14 min-w-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-control)] bg-green px-8 font-sans text-ui-base font-bold text-white shadow-[0_8px_20px_-12px_var(--green-shadow)] transition-[transform,box-shadow,background-color] duration-200 ease-out-expo hover:-translate-y-px hover:bg-green-hover hover:shadow-[0_10px_24px_-12px_var(--green-shadow)] active:translate-y-0 motion-reduce:transition-none sm:h-16 sm:px-10 sm:text-btn-lg sm:shadow-[0_10px_24px_-12px_var(--green-shadow)] sm:hover:shadow-[0_12px_28px_-12px_var(--green-shadow)]"
                aria-label="Begin writing"
              >
                {HOME_SEO.ctaLabel}
                <ArrowRightIcon className="ml-2.5 h-[1.125rem] w-[1.125rem] text-white/80 transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5 sm:ml-3 sm:h-5 sm:w-5" />
              </button>
            </div>

            <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:gap-x-10 lg:gap-x-12">
              <div className="flex min-w-0 items-center gap-x-8 sm:gap-x-10">
                <a
                  href={RoutePath.LOGIN}
                  onClick={(event) => handleAppRouteNavigation(event, RoutePath.LOGIN)}
                  className="inline-flex h-11 min-h-11 min-w-0 items-center justify-center whitespace-nowrap px-1 text-btn-sm font-bold text-gray-nav transition-[color,transform] duration-200 ease-out-expo hover:-translate-y-px hover:text-green active:translate-y-px"
                >
                  Sign in
                </a>

                <a
                  href={RoutePath.FAQ}
                  className="inline-flex h-11 min-h-11 min-w-0 items-center justify-center whitespace-nowrap px-1 text-btn-sm font-bold text-gray-nav transition-[color,transform] duration-200 ease-out-expo hover:-translate-y-px hover:text-green active:translate-y-px"
                >
                  How it works
                </a>
              </div>

              <button
                type="button"
                onClick={toggleMute}
                className="surface-floating surface-floating--media flex h-12 min-h-12 w-12 min-w-12 shrink-0 items-center justify-center rounded-2xl !text-gray-text transition-[color,border-color,transform] duration-200 ease-out-expo hover:-translate-y-px hover:border-green/30 hover:!text-gray-text active:translate-y-0 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-green/40"
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
    </div>
  );
};

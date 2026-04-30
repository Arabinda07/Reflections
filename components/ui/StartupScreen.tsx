import React, { useState } from 'react';
import { OverlayFeedback } from './OverlayFeedback';

interface StartupScreenProps {
  isVisible: boolean;
}

/**
 * StartupScreen Component
 * 
 * Provides a premium, liquid-glass transition for the PWA boot sequence.
 * This bridges the gap between the OS Splash and the React App Initialization.
 * The parent OverlayFeedback handles the enter/exit animation — this component
 * only owns its internal content and avoids a competing AnimatePresence exit.
 */
export const StartupScreen: React.FC<StartupScreenProps> = ({ isVisible }) => {
  const [isVideoReady, setIsVideoReady] = useState(false);

  return (
    <OverlayFeedback isVisible={isVisible} overlayClassName="overlay-feedback--screen">
      <div
        className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-body"
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,oklch(from_var(--green)_0.26_0.04_h_/_0.32),var(--bg-color)_58%)]">
          <div className="absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),transparent_36%,rgba(0,0,0,0.2))]" />

          {/* Static poster — renders instantly, zero autoplay dependency */}
          <img
            src="/assets/videos/sanctuary.png"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            className="absolute inset-0 z-0 h-full w-full object-cover opacity-85"
          />

          {/* Crossfade with the poster so startup never stacks two bright media layers. */}
          <video
            src="/assets/videos/sanctuary.mp4"
            poster="/assets/videos/sanctuary.png"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
            onLoadedData={() => setIsVideoReady(true)}
            className={`absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-700 ease-out ${
              isVideoReady ? 'opacity-85' : 'opacity-0'
            }`}
          />
        </div>

        <div className="absolute bottom-14 z-20 flex flex-col items-center gap-2">
          <span
            className="overlay-feedback-wordmark text-white/90 [text-shadow:0_2px_8px_rgba(0,0,0,0.2)]"
          >
            reflections
          </span>

          <div
            className="overlay-feedback-divider bg-green/60"
            style={{ width: 32 }}
          />
        </div>
      </div>
    </OverlayFeedback>
  );
};


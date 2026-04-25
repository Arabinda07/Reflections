import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OverlayFeedback } from './OverlayFeedback';

interface StartupScreenProps {
  isVisible: boolean;
}

/**
 * StartupScreen Component
 * 
 * Provides a premium, liquid-glass transition for the PWA boot sequence.
 * This bridges the gap between the OS Splash and the React App Initialization.
 * Hardened with Portals to ensure it occupies the entire viewport.
 */
export const StartupScreen: React.FC<StartupScreenProps> = ({ isVisible }) => {
  const [isVideoReady, setIsVideoReady] = useState(false);

  return (
    <OverlayFeedback isVisible={isVisible} overlayClassName="overlay-feedback--screen">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{
              duration: 0.26,
              ease: [0.43, 0.13, 0.23, 0.96],
            }}
            className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-body"
            style={{ touchAction: 'none' }}
          >
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,oklch(from_var(--green)_0.26_0.04_h_/_0.32),var(--bg-color)_58%)]">
              <div className="absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),transparent_36%,rgba(0,0,0,0.2))]" />

              <video
                src="/assets/videos/sanctuary.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
                onLoadedData={() => setIsVideoReady(true)}
                className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-500 ${
                  isVideoReady ? 'opacity-85' : 'opacity-0'
                }`}
              />
            </div>

            <div className="absolute bottom-14 z-20 flex flex-col items-center gap-2">
              <motion.span
                initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.55,
                  delay: 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="overlay-feedback-wordmark text-white/90 [text-shadow:0_2px_8px_rgba(0,0,0,0.2)]"
              >
                reflections
              </motion.span>

              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 32, opacity: 1 }}
                transition={{
                  duration: 0.35,
                  delay: 0.3,
                  ease: 'easeOut',
                }}
                className="overlay-feedback-divider bg-green/60"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </OverlayFeedback>
  );
};

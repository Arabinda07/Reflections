import React, { useEffect, useRef } from 'react';
import { DotLottieReact, type DotLottie } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'motion/react';

interface PaperPlaneToastProps {
  /** Show the plane — triggers the animation */
  isVisible: boolean;
  /** Called when the plane animation has fully completed its arc */
  onAnimationComplete: () => void;
}

/**
 * PaperPlaneToast
 *
 * A small, non-blocking strip at the bottom of the screen.
 * A paper plane flies across once, fully completing its arc,
 * then fades out and calls onAnimationComplete.
 *
 * Design intent: accompanies the save operation without blocking the UI.
 * The save happens concurrently; this is a ritual, not a gate.
 */
export const PaperPlaneToast: React.FC<PaperPlaneToastProps> = ({
  isVisible,
  onAnimationComplete,
}) => {
  const lottieRef = useRef<DotLottie | null>(null);
  const hasCompleted = useRef(false);

  useEffect(() => {
    if (!isVisible) {
      hasCompleted.current = false;
      return;
    }

    // Attach the onComplete listener once the Lottie instance is ready
    const instance = lottieRef.current;
    if (!instance) return;

    const handleComplete = () => {
      if (hasCompleted.current) return;
      hasCompleted.current = true;
      // Small breath before fading out — feels natural
      setTimeout(() => {
        onAnimationComplete();
      }, 400);
    };

    instance.addEventListener('complete', handleComplete);
    return () => {
      instance.removeEventListener('complete', handleComplete);
    };
  }, [isVisible, onAnimationComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="paper-plane-toast"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16, transition: { duration: 0.6, ease: 'easeInOut' } }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          // Fixed strip at the bottom — does not block content above
          className="fixed bottom-6 inset-x-0 z-[9000] flex items-center justify-center pointer-events-none"
          aria-live="polite"
          aria-label="Saving your entry"
        >
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl"
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(229,229,229,0.8)',
              boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08), 0 2px 0 0 #E5E5E5',
            }}
          >
            {/* Paper plane Lottie — plays once, no loop */}
            <div className="w-[56px] h-[56px] shrink-0">
              <DotLottieReact
                src="https://lottie.host/44bd266f-34f2-4b70-87df-fb47ff5962a5/4mw21xhUNV.lottie"
                autoplay
                loop={false}
                dotLottieRefCallback={(ref) => {
                  lottieRef.current = ref;
                }}
                className="w-full h-full"
              />
            </div>

            {/* Label */}
            <span
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#4b4b4b',
              }}
            >
              sending to your sanctuary
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

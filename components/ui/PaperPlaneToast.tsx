import React, { useEffect, useRef } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'motion/react';

interface PaperPlaneToastProps {
  /** Show the plane — triggers the animation */
  isVisible: boolean;
  /**
   * Called exactly 2 seconds after becoming visible.
   * Deterministic — does not rely on Lottie's onComplete event.
   */
  onAnimationComplete: () => void;
}

/**
 * PaperPlaneToast
 *
 * Fixed bottom bar. Paper plane Lottie plays for exactly 2 seconds,
 * then calls onAnimationComplete and fades out.
 * Uses a plain setTimeout — immune to Lottie event bugs.
 */
export const PaperPlaneToast: React.FC<PaperPlaneToastProps> = ({
  isVisible,
  onAnimationComplete,
}) => {
  const callbackRef = useRef(onAnimationComplete);
  callbackRef.current = onAnimationComplete; // always up-to-date

  useEffect(() => {
    if (!isVisible) return;

    // Fixed 2-second window — matches the paper plane arc duration
    const timer = setTimeout(() => {
      callbackRef.current();
    }, 1500);

    return () => clearTimeout(timer);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="paper-plane-toast"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 1.04 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: 0,
            right: 0,
            zIndex: 9000,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
          aria-live="polite"
          aria-label="Saving your entry"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 24px 10px 12px',
              borderRadius: '24px',
              backgroundColor: 'var(--panel-bg)',
              opacity: 0.98,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1.5px solid var(--border-color)',
              boxShadow: '0 12px 36px -12px rgba(0,0,0,0.15)',
            }}
          >
            {/* Paper plane Lottie */}
            <div style={{ width: '80px', height: '80px', flexShrink: 0, margin: '-14px 0 -14px -8px' }}>
              <DotLottieReact
                key={isVisible ? 'visible' : 'hidden'}
                src="https://lottie.host/44bd266f-34f2-4b70-87df-fb47ff5962a5/4mw21xhUNV.lottie"
                autoplay
                loop
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            {/* Label */}
            <span
              style={{
                fontFamily: '"Schibsted Grotesk", sans-serif',
                fontSize: '13px',
                fontWeight: 800,
                color: 'var(--gray-text)',
                whiteSpace: 'nowrap',
              }}
            >
              Sending to sanctuary
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

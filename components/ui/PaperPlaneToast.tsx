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
    }, 2000);

    return () => clearTimeout(timer);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="paper-plane-toast"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
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
              padding: '10px 20px 10px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(229,229,229,0.9)',
              boxShadow: '0 8px 28px -6px rgba(0,0,0,0.12), 0 2px 0 0 #E5E5E5',
            }}
          >
            {/* Paper plane Lottie */}
            <div style={{ width: '52px', height: '52px', flexShrink: 0 }}>
              <DotLottieReact
                src="https://lottie.host/44bd266f-34f2-4b70-87df-fb47ff5962a5/4mw21xhUNV.lottie"
                autoplay
                loop={false}
                style={{ width: '100%', height: '100%' }}
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
                whiteSpace: 'nowrap',
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

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'motion/react';
import paperPlaneData from '@/src/lottie/paperplane.json';

interface PaperPlaneToastProps {
  /** Show the plane — triggers the animation */
  isVisible: boolean;
  /** Optional callback for when animation ends */
  onAnimationComplete?: () => void;
}

/**
 * PaperPlaneToast — Global feedback for "Sending to Sanctuary"
 * 
 * DESIGN: Uses Portal architecture (from LoadingState.tsx) to survive 
 * editor unmounts during navigation.
 */
export const PaperPlaneToast: React.FC<PaperPlaneToastProps> = ({
  isVisible,
  onAnimationComplete,
}) => {
  // Fail-safe: Always trigger completion after 3.5s (logic from CompanionObservation)
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        console.log("[PLANE] Fail-safe timer triggered.");
        onAnimationComplete?.();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onAnimationComplete]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="sanctuary-plane-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: -40, opacity: 0 }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 200,
              mass: 0.8
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'white',
              padding: '12px 24px 12px 16px',
              borderRadius: '24px',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ width: '80px', height: '80px', flexShrink: 0, margin: '-14px 0 -14px -8px' }}>
              <DotLottieReact
                data={paperPlaneData}
                autoplay={true}
                loop={true}
                speed={1.5}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ 
                fontFamily: '"Schibsted Grotesk", sans-serif',
                fontSize: '15px', 
                fontWeight: 800, 
                color: '#1a1a1a',
                letterSpacing: '-0.01em',
                lineHeight: 1.2
              }}>
                Sending to sanctuary
              </span>
              <span style={{ 
                fontFamily: '"Schibsted Grotesk", sans-serif',
                fontSize: '11px', 
                fontWeight: 600, 
                color: '#888',
                textTransform: 'lowercase',
                opacity: 0.8
              }}>
                Finalizing your reflection
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

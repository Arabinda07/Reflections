import React from 'react';
import { createPortal } from 'react-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'motion/react';

// Canonical brand footer style — identical across all sanctuary animations
const BRAND_WORDMARK_STYLE: React.CSSProperties = {
  fontFamily: 'Nunito, sans-serif',
  fontSize: '20px',
  letterSpacing: '-0.02em',
  textTransform: 'lowercase',
  fontWeight: 700,
};

const BRAND_DIVIDER_STYLE: React.CSSProperties = {
  height: '2px',
  width: '32px',
  borderRadius: '9999px',
  backgroundColor: 'rgba(88,204,2,0.3)',
};

interface LoadingStateProps {
  message?: string;
  isVisible?: boolean;
}

/**
 * LoadingState — Page Transition Loader
 * 
 * Distinct from StartupScreen (which uses the hero video).
 * Uses the finger-tapping brand Lottie for all in-app loading states:
 * — Opening "My Notes" (Total Reflections)
 * — Opening an existing journal entry
 * 
 * Light-mode locked. All colors hardcoded inline.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "gathering your thoughts...",
  isVisible = true
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          key="loading-sanctuary"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white dark:bg-body"
        >
          {/* Finger-Tapping Brand Lottie */}
          <div className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px]">
            <DotLottieReact
              src="https://lottie.host/16016d7c-4339-4feb-bea8-af73664d180d/OE9KL3HbaN.lottie"
              loop
              autoplay
              className="w-full h-full"
            />
          </div>

          {/* Qualitative message */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            style={{
              marginTop: '8px',
              fontSize: '13px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.25em',
              color: '#777777',
            }}
          >
            {message}
          </motion.p>

          {/* Brand Wordmark — canonical style */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-14 flex flex-col items-center gap-2"
          >
            <span style={BRAND_WORDMARK_STYLE} className="text-gray-text opacity-75 dark:text-zinc-100">reflections</span>
            <div style={BRAND_DIVIDER_STYLE} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

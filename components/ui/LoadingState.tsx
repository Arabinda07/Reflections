import React from 'react';
import { createPortal } from 'react-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'motion/react';
import loadingData from '@/src/lottie/loading.json';

// Canonical brand footer style — identical across all sanctuary animations
const BRAND_WORDMARK_STYLE: React.CSSProperties = {
  fontFamily: '"Schibsted Grotesk", sans-serif',
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
  message = "Gathering your thoughts...",
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
          className="fixed inset-0 !z-[999999] flex flex-col items-center justify-center bg-white dark:bg-[#121212]"
        >
          {/* Finger-Tapping Brand Lottie */}
          <div className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px]">
            <DotLottieReact
              data={loadingData}
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
              marginTop: '12px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#777777',
            }}
          >
            {message}
          </motion.p>

        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

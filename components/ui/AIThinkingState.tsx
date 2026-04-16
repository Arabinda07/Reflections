import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'motion/react';

const MESSAGES = [
  "noticing patterns",
  "weaving thoughts",
  "gathering insights",
  "finding clarity",
  "centering sanctuary"
];

// Canonical brand footer style — light-mode locked, shared across all sanctuary animations
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

interface AIThinkingStateProps {
  isVisible: boolean;
  /**
   * Optional: provide a skip callback to show a "skip" button after 3 seconds.
   * Used on the Insights page where loading can take up to 7s.
   */
  onSkip?: () => void;
}

/**
 * AIThinkingState — Cinematic AI Sanctuary Overlay
 * Trigger: Mental Health Insights page load + Deep Reflection generation.
 * Uses the Spark Lottie animation. Light-mode locked (hardcoded inline styles).
 * Optional skip button appears after 3s when onSkip is provided.
 */
export const AIThinkingState: React.FC<AIThinkingStateProps> = ({ isVisible, onSkip }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0);
      setShowSkip(false);
      return;
    }

    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);

    // Show skip option after 3 seconds if onSkip is provided
    let skipTimer: ReturnType<typeof setTimeout> | null = null;
    if (onSkip) {
      skipTimer = setTimeout(() => setShowSkip(true), 3000);
    }

    return () => {
      clearInterval(msgInterval);
      if (skipTimer) clearTimeout(skipTimer);
    };
  }, [isVisible, onSkip]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="ai-sanctuary"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white dark:bg-body"
        >
          {/* Spark Lottie Animation */}
          <div className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px]">
            <DotLottieReact
              src="https://lottie.host/5227f55d-a0bd-48b5-98a8-04751a6dffb7/4D3o2TMxWZ.lottie"
              loop
              autoplay
              className="w-full h-full"
            />
          </div>

          {/* Rotating 2-3 word messages */}
          <div className="mt-6 h-8 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={MESSAGES[messageIndex]}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45 }}
                style={{
                  fontSize: '13px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  color: '#777777',
                }}
              >
                {MESSAGES[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Skip button — appears after 3s, only when onSkip is provided */}
          <AnimatePresence>
            {showSkip && onSkip && (
              <motion.button
                key="skip-btn"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.4 }}
                onClick={onSkip}
                style={{
                  marginTop: '28px',
                  padding: '8px 24px',
                  borderRadius: '9999px',
                  border: '1.5px solid rgba(0,0,0,0.1)',
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '11px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: '#999999',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
              >
                skip →
              </motion.button>
            )}
          </AnimatePresence>

          {/* Brand Wordmark — canonical style, dark-mode immune */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="absolute bottom-14 flex flex-col items-center gap-2"
          >
            <span style={BRAND_WORDMARK_STYLE} className="text-gray-text opacity-75 dark:text-zinc-100">reflections</span>
            <div style={BRAND_DIVIDER_STYLE} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

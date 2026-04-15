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

interface AIThinkingStateProps {
  isVisible: boolean;
}

/**
 * AIThinkingState - Cinematic AI Sanctuary Overlay
 * Uses the Spark Lottie for Mental Health Insights & Deep Reflection.
 * Light-mode locked with rotating 2-3 word qualitative messages.
 */
export const AIThinkingState: React.FC<AIThinkingStateProps> = ({ isVisible }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="ai-sanctuary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Spark Lottie Animation */}
          <div className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] relative">
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
                className="text-[13px] font-black uppercase tracking-[0.25em]"
                style={{ color: '#777777' }}
              >
                {MESSAGES[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Brand wordmark */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="absolute bottom-14 flex flex-col items-center gap-2"
          >
            <span
              className="text-[22px] lowercase tracking-tight"
              style={{ fontFamily: 'var(--font-display, Nunito, sans-serif)', color: '#4b4b4b', opacity: 0.7 }}
            >
              reflections
            </span>
            <div className="h-[2px] w-8 rounded-full" style={{ backgroundColor: 'rgba(88,204,2,0.25)' }} />
          </motion.div>

          {/* 7-second progress bar */}
          <div
            className="absolute bottom-10 w-44 h-[3px] rounded-full overflow-hidden"
            style={{ backgroundColor: '#f0f0f0' }}
          >
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 7, ease: "linear" }}
              className="h-full w-full rounded-full"
              style={{ backgroundColor: 'rgba(88,204,2,0.3)' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

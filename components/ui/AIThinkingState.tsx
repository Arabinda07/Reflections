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
 * AIThinkingState - The "Ultimate" Cinematic AI Overlay
 * Standardized with the finger-tapping brand animation.
 * Features rotating qualitative messages and a forced white sanctuary background.
 */
export const AIThinkingState: React.FC<AIThinkingStateProps> = ({ isVisible }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white"
        >
          {/* Principal Brand Animation (Finger Tapping) */}
          <div className="w-[320px] h-[320px] relative">
             <div className="absolute inset-0 bg-green/5 blur-3xl rounded-full scale-75 animate-pulse" />
             
             <DotLottieReact
               src="https://lottie.host/16016d7c-4339-4feb-bea8-af73664d180d/OE9KL3HbaN.lottie"
               loop
               autoplay
               className="relative z-10 w-full h-full"
             />
          </div>

          {/* Rotating AI Reflection Messages */}
          <div className="mt-8 h-8 flex flex-col items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p 
                key={MESSAGES[messageIndex]}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-[14px] font-bold text-gray-light uppercase tracking-[0.2em] font-display"
              >
                {MESSAGES[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
          
          {/* Brand Footer to match Splash Screen */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-16 flex flex-col items-center gap-2"
          >
            <span className="text-[20px] font-display text-gray-text lowercase tracking-tight opacity-80">
              reflections
            </span>
            <div className="h-[2px] w-8 bg-green/20 rounded-full" />
          </motion.div>
          
          {/* Progress bar to give a sense of duration */}
          <div className="absolute bottom-12 w-48 h-1 bg-gray-50 rounded-full overflow-hidden border border-border/50">
             <motion.div 
               initial={{ x: "-100%" }}
               animate={{ x: "0%" }}
               transition={{ duration: 7, ease: "linear" }}
               className="h-full w-full bg-green/20"
             />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

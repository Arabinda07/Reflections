import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
 * Hardened with Portals to guarantee a total white blanket across the entire viewport.
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
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white"
        >
          {/* Main Cinematic Video Container */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Subtle backlight glow */}
            <div className="absolute inset-0 bg-green/5 blur-3xl rounded-full scale-75 animate-pulse z-10" />
            
            <video 
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_074327_a4d6275d-82d9-4c83-bfbe-f1fb2213c17c.mp4"
              autoPlay 
              loop 
              muted 
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-0"
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

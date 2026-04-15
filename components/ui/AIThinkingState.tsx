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
          <div className="w-[320px] h-[320px] relative">
             {/* Subtle backlight glow */}
             <div className="absolute inset-0 bg-blue/5 blur-3xl rounded-full scale-75 animate-pulse" />
             
             <DotLottieReact
               src="https://lottie.host/5227f55d-a0bd-48b5-98a8-04751a6dffb7/4D3o2TMxWZ.lottie"
               loop
               autoplay
               className="relative z-10 w-full h-full"
             />
          </div>

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
          
          {/* Progress bar to give a sense of duration */}
          <div className="absolute bottom-12 w-48 h-1 bg-gray-50 rounded-full overflow-hidden border border-border/50">
             <motion.div 
               initial={{ x: "-100%" }}
               animate={{ x: "0%" }}
               transition={{ duration: 7, ease: "linear" }}
               className="h-full w-full bg-green/30"
             />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

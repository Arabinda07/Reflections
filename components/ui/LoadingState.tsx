import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingStateProps {
  message?: string;
  isVisible?: boolean;
}

/**
 * LoadingState - The "Ultimate" Cinematic Loader
 * Based on the Startup Splash Screen branding.
 * Forced white sanctuary background.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "gathering your thoughts...",
  isVisible = true
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white"
        >
          {/* Main Finger-Tapping / Logo Animation */}
          <div className="w-[320px] h-[320px] relative">
             <div className="absolute inset-0 bg-green/5 blur-3xl rounded-full scale-75 animate-pulse" />
             
             <DotLottieReact
               src="https://lottie.host/16016d7c-4339-4feb-bea8-af73664d180d/OE9KL3HbaN.lottie"
               loop
               autoplay
               className="relative z-10 w-full h-full"
             />
          </div>

          {/* Qualitative Message */}
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-[14px] font-bold text-gray-light uppercase tracking-[0.2em] font-display mt-4"
          >
            {message}
          </motion.p>
          
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
          
          {/* Subtle progress bar */}
          <div className="absolute bottom-12 w-48 h-1 bg-gray-50 rounded-full overflow-hidden border border-border/50">
             <motion.div 
               initial={{ x: "-100%" }}
               animate={{ x: "0%" }}
               transition={{ duration: 6, ease: "linear" }}
               className="h-full w-full bg-green/20"
             />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

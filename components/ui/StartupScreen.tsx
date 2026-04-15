import React from 'react';
import { createPortal } from 'react-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'motion/react';

interface StartupScreenProps {
  isVisible: boolean;
}

/**
 * StartupScreen Component
 * 
 * Provides a premium, liquid-glass transition for the PWA boot sequence.
 * This bridges the gap between the OS Splash and the React App Initialization.
 * Hardened with Portals to ensure it occupies the entire viewport.
 */
export const StartupScreen: React.FC<StartupScreenProps> = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.43, 0.13, 0.23, 0.96] // Premium liquid ease
          }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white"
          style={{ touchAction: 'none' }}
        >
          {/* Main Animation Container */}
          <div className="relative w-[320px] h-[320px] flex items-center justify-center">
            {/* Subtle backlight glow */}
            <div className="absolute inset-0 bg-green/5 blur-3xl rounded-full scale-75 animate-pulse" />
            
            <DotLottieReact
               src="https://lottie.host/16016d7c-4339-4feb-bea8-af73664d180d/OE9KL3HbaN.lottie"
               loop
               autoplay
               className="relative z-10 w-full h-full"
            />
          </div>

          {/* Minimalist Brand Footer */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute bottom-16 flex flex-col items-center gap-2"
          >
            <span className="text-[20px] font-display text-gray-text lowercase tracking-tight opacity-80">
              reflections
            </span>
            <div className="h-[2px] w-8 bg-green/20 rounded-full" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

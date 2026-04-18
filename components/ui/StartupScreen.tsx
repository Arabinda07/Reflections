import React from 'react';
import { createPortal } from 'react-dom';
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
          {/* Main Cinematic Video Container */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Subtle backlight glow */}
            <div className="absolute inset-0 bg-green/5 blur-3xl rounded-full scale-75 animate-pulse z-10" />
            
            <video 
              src="/assets/videos/sanctuary.mp4"
              autoPlay 
              loop 
              muted 
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          </div>

          {/* Brand Wordmark — premium staggered reveal */}
          <div className="absolute bottom-14 flex flex-col items-center gap-2 z-20">
            <motion.span
              initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ 
                duration: 1.2, 
                delay: 0.6, 
                ease: [0.22, 1, 0.36, 1] 
              }}
              style={{
                fontFamily: '"Schibsted Grotesk", sans-serif',
                fontSize: '20px',
                letterSpacing: '-0.02em',
                textTransform: 'lowercase',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.9)',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              reflections
            </motion.span>
            
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 32, opacity: 1 }}
              transition={{ 
                duration: 0.8, 
                delay: 1.3, 
                ease: "easeOut" 
              }}
              style={{ 
                height: '2px', 
                borderRadius: '9999px', 
                backgroundColor: 'rgba(88,204,2,0.6)' 
              }} 
            />
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};

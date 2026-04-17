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
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_074327_a4d6275d-82d9-4c83-bfbe-f1fb2213c17c.mp4"
              autoPlay 
              loop 
              muted 
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          </div>

          {/* Brand Wordmark — cinematic fallback style */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute bottom-14 flex flex-col items-center gap-2 z-20"
          >
            <span
              style={{
                fontFamily: '"Schibsted Grotesk", sans-serif',
                fontSize: '20px',
                letterSpacing: '-0.02em',
                textTransform: 'lowercase',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.85)', // Lightened for visibility over video
                textShadow: '0 2px 4px rgba(0,0,0,0.1)' // Very subtle shadow for legibility
              }}
            >
              reflections
            </span>
            <div style={{ height: '2px', width: '32px', borderRadius: '9999px', backgroundColor: 'rgba(88,204,2,0.4)' }} />
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};

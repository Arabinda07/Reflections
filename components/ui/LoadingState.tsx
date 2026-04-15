import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingStateProps {
  message?: string;
  isVisible?: boolean;
}

/**
 * LoadingState — Brand Cinematic Loader
 * Uses the startup video. All colors hardcoded to be fully dark-mode immune.
 * Text elements are explicitly z-layered above the video.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "gathering your thoughts...",
  isVisible = true
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          key="loading-sanctuary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Video fills the whole overlay */}
          <video 
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_074327_a4d6275d-82d9-4c83-bfbe-f1fb2213c17c.mp4"
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          {/* Dark overlay for legibility — subtle, not heavy */}
          <div className="absolute inset-0 z-[1]" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />

          {/* Qualitative Message — above video */}
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="relative z-[2] text-[13px] font-black uppercase tracking-[0.25em]"
            style={{ color: '#4b4b4b' }}
          >
            {message}
          </motion.p>

          {/* Brand Wordmark — canonical style, dark-mode immune */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-14 z-[2] flex flex-col items-center gap-2"
          >
            <span
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '20px',
                color: '#4b4b4b',
                opacity: 0.75,
                letterSpacing: '-0.02em',
                textTransform: 'lowercase',
                fontWeight: 700,
              }}
            >
              reflections
            </span>
            <div style={{ height: '2px', width: '32px', borderRadius: '9999px', backgroundColor: 'rgba(88,204,2,0.3)' }} />
          </motion.div>
          
          {/* Progress bar */}
          <div
            className="absolute bottom-10 z-[2] w-44 h-[3px] rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
          >
            <motion.div 
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 6, ease: "linear" }}
              className="h-full w-full rounded-full"
              style={{ backgroundColor: 'rgba(88,204,2,0.4)' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

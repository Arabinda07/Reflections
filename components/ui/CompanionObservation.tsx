import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import trailData from '@/src/lottie/trail-loading.json';

interface CompanionObservationProps {
  isVisible: boolean;
  text: string;
  onComplete: () => void;
}

/**
 * CompanionObservation — Milestone celebration overlay
 * 
 * DESIGN: Uses Portal architecture (from LoadingState.tsx) to ensure 
 * the celebration cards follow the user across page transitions.
 */
export const CompanionObservation: React.FC<CompanionObservationProps> = ({ 
  isVisible, 
  text, 
  onComplete 
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 5500); // Give enough time for the animation and for the user to read
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          key="companion-observation-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          <div className="w-72 h-72 md:w-96 md:h-96 -mt-10">
            <DotLottieReact
              data={trailData}
              autoplay={true}
              loop={true}
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="max-w-md"
          >
            <p className="text-[20px] md:text-[24px] font-display text-gray-text lowercase leading-relaxed tracking-tight">
              {text}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

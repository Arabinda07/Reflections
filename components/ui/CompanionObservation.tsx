import React, { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import trailData from '../../lottie/trail-loading.json';

interface CompanionObservationProps {
  isVisible: boolean;
  text: string;
  onComplete: () => void;
}

export const CompanionObservation: React.FC<CompanionObservationProps> = ({ isVisible, text, onComplete }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 5500); // Give enough time for the animation and for the user to read
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-[300] bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
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
    </AnimatePresence>
  );
};

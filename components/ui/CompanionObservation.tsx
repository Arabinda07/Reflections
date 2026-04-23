import React, { useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'motion/react';
import trailData from '@/src/lottie/trail-loading.json';
import { OverlayFeedback } from './OverlayFeedback';

interface CompanionObservationProps {
  isVisible: boolean;
  text: string;
  onComplete: () => void;
}

export const CompanionObservation: React.FC<CompanionObservationProps> = ({
  isVisible,
  text,
  onComplete,
}) => {
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      onComplete();
    }, 5500);

    return () => clearTimeout(timer);
  }, [isVisible, onComplete]);

  return (
    <OverlayFeedback isVisible={isVisible} overlayClassName="overlay-feedback--veil">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-72 h-72 md:w-96 md:h-96 -mt-10">
          <DotLottieReact data={trailData} autoplay loop />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.8 }}
          className="overlay-feedback-copy max-w-md"
        >
          <span className="label-caps mb-4 block">A gentle note</span>
          <h2 className="h2-section mb-6 lowercase">{text}</h2>
          <div className="overlay-feedback-divider mx-auto opacity-50" />
        </motion.div>
      </div>
    </OverlayFeedback>
  );
};

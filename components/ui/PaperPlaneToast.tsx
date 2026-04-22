import React, { useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'motion/react';
import paperPlaneData from '@/src/lottie/paperplane.json';
import { OverlayFeedback } from './OverlayFeedback';

interface PaperPlaneToastProps {
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

export const PaperPlaneToast: React.FC<PaperPlaneToastProps> = ({
  isVisible,
  onAnimationComplete,
}) => {
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 3500);

    return () => clearTimeout(timer);
  }, [isVisible, onAnimationComplete]);

  return (
    <OverlayFeedback
      isVisible={isVisible}
      overlayClassName="overlay-feedback--soft"
      contentClassName="overlay-feedback-card overlay-feedback-card--row"
      pointerEvents="none"
    >
      <motion.div
        initial={{ scale: 0.9, y: 14 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: -16, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 220, mass: 0.8 }}
        className="flex items-center gap-3"
      >
        <div className="w-[80px] h-[80px] shrink-0 -my-3 -ml-2">
          <DotLottieReact
            data={paperPlaneData}
            autoplay
            loop
            speed={1.5}
            className="w-full h-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="overlay-feedback-title">Saving reflection</span>
          <span className="overlay-feedback-wordmark">Sending to sanctuary</span>
        </div>
      </motion.div>
    </OverlayFeedback>
  );
};

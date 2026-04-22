import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'motion/react';
import loadingData from '@/src/lottie/loading.json';
import { OverlayFeedback } from './OverlayFeedback';

interface LoadingStateProps {
  message?: string;
  isVisible?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Gathering your thoughts...',
  isVisible = true,
}) => {
  return (
    <OverlayFeedback isVisible={isVisible} overlayClassName="overlay-feedback--screen">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px]">
          <DotLottieReact data={loadingData} loop autoplay className="w-full h-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="overlay-feedback-copy -mt-3"
        >
          <span className="overlay-feedback-wordmark">reflections</span>
          <span className="overlay-feedback-divider" />
          <p className="overlay-feedback-message">{message}</p>
        </motion.div>
      </div>
    </OverlayFeedback>
  );
};

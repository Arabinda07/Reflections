import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import loadingAnimation from '@/src/lottie/loading.json';
import { OverlayFeedback } from './OverlayFeedback';

interface LoadingStateProps {
  title?: string;
  isVisible?: boolean;
  animationData?: Record<string, unknown>;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Gathering your thoughts...',
  isVisible = true,
  animationData = loadingAnimation,
}) => {
  return (
    <OverlayFeedback isVisible={isVisible} overlayClassName="overlay-feedback--screen">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-8 h-48 w-48 max-w-full" aria-hidden="true">
          <DotLottieReact data={animationData} autoplay loop />
        </div>

        <div className="overlay-feedback-copy body-editorial sr-only">
          <h2 className="h2-section mb-0">{title}</h2>
        </div>
      </div>
    </OverlayFeedback>
  );
};

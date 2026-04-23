import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import loadingAnimation from '@/src/lottie/loading.json';
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
        <div className="flex h-48 w-48 items-center justify-center">
          <DotLottieReact data={loadingAnimation} autoplay loop />
        </div>

        <div className="overlay-feedback-copy -mt-1">
          <p className="body-editorial max-w-sm">{message}</p>
        </div>
      </div>
    </OverlayFeedback>
  );
};

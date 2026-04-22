import React from 'react';
import { CircleNotch } from '@phosphor-icons/react';
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
        <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] border border-border bg-[rgba(var(--panel-bg-rgb),0.94)] shadow-[0_24px_48px_-32px_rgba(0,0,0,0.35)]">
          <CircleNotch size={28} className="animate-spin text-green" weight="bold" />
        </div>

        <div className="overlay-feedback-copy mt-5">
          <p className="overlay-feedback-message">{message}</p>
        </div>
      </div>
    </OverlayFeedback>
  );
};

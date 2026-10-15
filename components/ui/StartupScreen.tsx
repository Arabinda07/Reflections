import React from 'react';
import { OverlayFeedback } from './OverlayFeedback';

interface StartupScreenProps {
  isVisible: boolean;
}

/**
 * Quiet bridge between the OS splash and the first screen: just the wordmark,
 * shown only while auth resolves. No media, no minimum time.
 */
export const StartupScreen: React.FC<StartupScreenProps> = ({ isVisible }) => (
  <OverlayFeedback isVisible={isVisible} overlayClassName="overlay-feedback--screen">
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-body touch-none">
      <div className="flex flex-col items-center gap-2">
        <span className="overlay-feedback-wordmark text-gray-text">reflections</span>
        <div className="overlay-feedback-divider bg-green/60 w-8" />
      </div>
    </div>
  </OverlayFeedback>
);

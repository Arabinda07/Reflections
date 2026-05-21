import React from 'react';
import Lottie from 'lottie-react';
import trailLoadingAnimation from '@/src/lottie/trail-loading.json';

interface TrailLoadingMarkProps {
  className?: string;
  loop?: boolean;
  onComplete?: () => void;
}

export const TrailLoadingMark: React.FC<TrailLoadingMarkProps> = ({
  className = 'h-full w-full',
  loop = true,
  onComplete,
}) => (
  <Lottie
    animationData={trailLoadingAnimation as unknown}
    autoplay
    loop={loop}
    onComplete={onComplete}
    className={className}
  />
);

import React from 'react';
import Lottie from 'lottie-react';
import trailLoadingAnimation from '@/src/lottie/trail-loading.json';

interface TrailLoadingMarkProps {
  className?: string;
}

export const TrailLoadingMark: React.FC<TrailLoadingMarkProps> = ({ className = 'h-full w-full' }) => (
  <Lottie
    animationData={trailLoadingAnimation as unknown}
    autoplay
    loop
    className={className}
  />
);

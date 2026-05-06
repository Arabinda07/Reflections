import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '@/src/lottie/loading.json';

interface InlineLoadingBadgeProps {
  label: string;
  className?: string;
}

export const InlineLoadingBadge: React.FC<InlineLoadingBadgeProps> = ({
  label,
  className = '',
}) => {
  return (
    <span
      className={`metadata-pill metadata-pill--sage ${className}`.trim()}
    >
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green/8">
        <Lottie animationData={loadingAnimation as unknown} autoplay loop />
      </span>
      <span className="leading-none">{label}</span>
    </span>
  );
};

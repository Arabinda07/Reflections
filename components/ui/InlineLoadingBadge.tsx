import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
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
      className={`inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-green ${className}`.trim()}
    >
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green/8">
        <DotLottieReact data={loadingAnimation} autoplay loop />
      </span>
      <span className="leading-none">{label}</span>
    </span>
  );
};

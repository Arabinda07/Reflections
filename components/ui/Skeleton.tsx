import React from 'react';

interface SkeletonProps {
  className?: string;
  /** Visual shape hint */
  variant?: 'text' | 'circle' | 'card' | 'chart';
}

/**
 * Pulsing placeholder skeleton.
 * Respects `prefers-reduced-motion` via CSS.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
}) => {
  const base =
    'bg-surface-muted animate-pulse motion-reduce:animate-none rounded-xl';

  const variantClass: Record<string, string> = {
    text: 'h-4 w-full rounded-lg',
    circle: 'h-10 w-10 rounded-full',
    card: 'h-44 w-full',
    chart: 'h-6 w-full rounded-lg',
  };

  return (
    <div
      className={`${base} ${variantClass[variant]} ${className}`}
      aria-hidden="true"
    />
  );
};

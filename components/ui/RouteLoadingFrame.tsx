import React from 'react';

interface RouteLoadingFrameProps {
  className?: string;
}

/**
 * Minimal route-level loading placeholder.
 * Shows a pulsing bar that matches the platform's skeleton system
 * and respects `prefers-reduced-motion`.
 */
export const RouteLoadingFrame: React.FC<RouteLoadingFrameProps> = ({ className = '' }) => (
  <div
    aria-busy="true"
    aria-live="polite"
    className={`flex min-h-[60dvh] w-full flex-1 items-center justify-center bg-body px-6 py-12 ${className}`.trim()}
  >
    <span className="sr-only">Loading page</span>
    <div
      className="h-2 w-24 animate-pulse rounded-full bg-border/70 motion-reduce:animate-none"
      aria-hidden="true"
    />
  </div>
);

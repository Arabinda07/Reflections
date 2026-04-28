import React from 'react';

interface RouteLoadingFrameProps {
  className?: string;
}

export const RouteLoadingFrame: React.FC<RouteLoadingFrameProps> = ({ className = '' }) => (
  <div
    aria-busy="true"
    aria-live="polite"
    className={`flex min-h-[60dvh] w-full flex-1 items-center justify-center bg-body px-6 py-12 ${className}`.trim()}
  >
    <span className="sr-only">Loading page</span>
    <div className="h-2 w-24 rounded-full bg-border/70" aria-hidden="true" />
  </div>
);

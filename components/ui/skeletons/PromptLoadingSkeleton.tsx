import React from 'react';
import { Skeleton } from '../Skeleton';

/** Skeleton for the daily prompt text area in HomeAuthenticated. */
export const PromptLoadingSkeleton: React.FC = () => (
  <div className="space-y-3 py-2">
    <Skeleton variant="text" className="w-3/4 h-6" />
    <Skeleton variant="text" className="w-1/2 h-4" />
  </div>
);

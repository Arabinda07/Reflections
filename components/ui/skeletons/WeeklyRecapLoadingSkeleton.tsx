import React from 'react';
import { Skeleton } from '../Skeleton';

/** Skeleton for weekly recap stats and mood bars. */
export const WeeklyRecapLoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3 p-5 rounded-2xl border border-border/40">
          <Skeleton variant="text" className="w-24 h-3" />
          <Skeleton variant="text" className="w-16 h-8" />
        </div>
      ))}
    </div>
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="text" className="w-16 h-3" />
          <Skeleton variant="chart" className="flex-1 h-5" />
        </div>
      ))}
    </div>
  </div>
);

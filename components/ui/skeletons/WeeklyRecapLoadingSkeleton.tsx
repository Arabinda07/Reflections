import React from 'react';
import { Skeleton } from '../Skeleton';

/** Skeleton for weekly and monthly recap narrative prose. */
export const WeeklyRecapLoadingSkeleton: React.FC = () => (
  <div className="space-y-10">
    {/* This week section */}
    <div className="space-y-5">
      {/* Title skeleton: matches text-2xl md:text-3xl */}
      <Skeleton variant="text" className="w-28 h-6 md:h-8" />
      {/* Prose lines: matches the 1-3 sentences of week summary */}
      <div className="space-y-3">
        <Skeleton variant="text" className="w-full max-w-[45ch] h-4" />
        <Skeleton variant="text" className="w-11/12 max-w-[35ch] h-4" />
        <Skeleton variant="text" className="w-4/5 max-w-[30ch] h-4" />
      </div>
    </div>

    {/* This month section */}
    <div className="space-y-5">
      {/* Title skeleton */}
      <Skeleton variant="text" className="w-32 h-6 md:h-8" />
      {/* Prose lines: matches month summary */}
      <div className="space-y-3">
        <Skeleton variant="text" className="w-full max-w-[55ch] h-4" />
      </div>
    </div>
  </div>
);

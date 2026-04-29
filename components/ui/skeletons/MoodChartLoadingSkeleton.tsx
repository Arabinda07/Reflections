import React from 'react';
import { Skeleton } from '../Skeleton';

/** 5-row horizontal bar chart skeleton for mood distribution. */
export const MoodChartLoadingSkeleton: React.FC = () => (
  <div className="space-y-3">
    {['w-[85%]', 'w-[60%]', 'w-[45%]', 'w-[30%]', 'w-[20%]'].map((widthClass, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton variant="circle" className="h-6 w-6" />
        <Skeleton variant="text" className="w-14 h-3" />
        <Skeleton variant="chart" className={widthClass} />
      </div>
    ))}
  </div>
);

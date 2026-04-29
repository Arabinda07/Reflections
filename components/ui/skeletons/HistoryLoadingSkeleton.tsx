import React from 'react';
import { Skeleton } from '../Skeleton';
import { Surface } from '../Surface';

/**
 * Skeleton for the notes grid (MyNotes page).
 * Renders 6 card placeholders matching the note card layout.
 */
export const HistoryLoadingSkeleton: React.FC = () => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
    {Array.from({ length: 6 }).map((_, i) => (
      <Surface key={i} variant="flat" className="overflow-hidden">
        <div className="flex h-full flex-col">
          <Skeleton variant="card" className="rounded-none border-b border-border/40" />
          <div className="flex flex-1 flex-col p-6 space-y-4">
            <Skeleton variant="text" className="w-2/3 h-5" />
            <Skeleton variant="text" className="w-full" />
            <Skeleton variant="text" className="w-4/5" />
            <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton variant="circle" className="h-7 w-7" />
                <Skeleton variant="text" className="w-20 h-3" />
              </div>
              <Skeleton variant="text" className="w-14 h-3" />
            </div>
          </div>
        </div>
      </Surface>
    ))}
  </div>
);

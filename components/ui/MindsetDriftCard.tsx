import React from 'react';
import { Compass } from '@phosphor-icons/react/Compass';
import type { MindsetDriftReport } from '../../services/mindsetDrift';

interface MindsetDriftCardProps {
  report: MindsetDriftReport;
}

export const MindsetDriftCard: React.FC<MindsetDriftCardProps> = ({ report }) => {
  const {
    hasSufficientData,
    currentFamilyProportions,
    driftAngleDegrees,
    trajectorySummary,
    previousFamilyProportions,
  } = report;

  return (
    <section className="space-y-5" aria-label="Mindset trajectory and emotional drift">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Compass size={22} weight="duotone" className="text-green flex-none" />
          <h2 className="text-2xl font-display font-bold text-gray-text md:text-3xl">
            Mindset trajectory
          </h2>
        </div>
        {hasSufficientData && previousFamilyProportions ? (
          <span className="text-ui-xs font-bold text-gray-nav">
            {driftAngleDegrees}° movement
          </span>
        ) : null}
      </div>

      <p className="dashboard-supporting-text text-pretty">
        {trajectorySummary}
      </p>

      {hasSufficientData ? (
        <div className="space-y-3 pt-2">
          {/* Proportional Family Balance Bar */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted flex">
            {currentFamilyProportions.light > 0 ? (
              <div
                style={{ width: `${currentFamilyProportions.light}%` }}
                className="bg-mood-happy transition-all duration-500"
                title={`Light / Uplifting: ${currentFamilyProportions.light}%`}
              />
            ) : null}
            {currentFamilyProportions.steady > 0 ? (
              <div
                style={{ width: `${currentFamilyProportions.steady}%` }}
                className="bg-mood-calm transition-all duration-500"
                title={`Steady / Calm: ${currentFamilyProportions.steady}%`}
              />
            ) : null}
            {currentFamilyProportions.charged > 0 ? (
              <div
                style={{ width: `${currentFamilyProportions.charged}%` }}
                className="bg-mood-anxious transition-all duration-500"
                title={`Charged / Active: ${currentFamilyProportions.charged}%`}
              />
            ) : null}
            {currentFamilyProportions.heavy > 0 ? (
              <div
                style={{ width: `${currentFamilyProportions.heavy}%` }}
                className="bg-mood-sad transition-all duration-500"
                title={`Heavy / Tender: ${currentFamilyProportions.heavy}%`}
              />
            ) : null}
            {currentFamilyProportions.mixed > 0 ? (
              <div
                style={{ width: `${currentFamilyProportions.mixed}%` }}
                className="bg-mood-mixed transition-all duration-500"
                title={`Mixed / Complex: ${currentFamilyProportions.mixed}%`}
              />
            ) : null}
          </div>

          {/* Family Legends */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 text-ui-xs font-semibold text-gray-nav">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-mood-happy inline-block" />
              Light {currentFamilyProportions.light}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-mood-calm inline-block" />
              Steady {currentFamilyProportions.steady}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-mood-anxious inline-block" />
              Charged {currentFamilyProportions.charged}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-mood-sad inline-block" />
              Heavy {currentFamilyProportions.heavy}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-mood-mixed inline-block" />
              Mixed {currentFamilyProportions.mixed}%
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
};

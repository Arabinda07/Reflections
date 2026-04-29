import React from 'react';
import { Surface } from './Surface';
import type { SurfaceTone } from './surfaceTone';

interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  action?: React.ReactNode;
  surface?: 'bezel' | 'flat' | 'none';
  tone?: SurfaceTone;
  className?: string;
}

const EmptyStateBody: React.FC<Omit<EmptyStateProps, 'surface'>> = ({
  title,
  description,
  icon,
  illustration,
  action,
  className = '',
}) => (
  <div className={`empty-state ${className}`.trim()}>
    {illustration ? (
      <div className="mb-4 h-48 w-48 max-w-full" aria-hidden="true">
        {illustration}
      </div>
    ) : icon ? (
      <div className="empty-state-icon">{icon}</div>
    ) : null}
    <div className="empty-state-copy">
      <h3 className="empty-state-title">{title}</h3>
      {description ? <div className="empty-state-description">{description}</div> : null}
    </div>
    {action ? <div className="empty-state-action">{action}</div> : null}
  </div>
);

export const EmptyState: React.FC<EmptyStateProps> = ({
  surface = 'bezel',
  tone = 'inherit',
  ...props
}) => {
  if (surface === 'none') {
    return <EmptyStateBody {...props} />;
  }

  return (
    <Surface variant={surface} tone={tone} className="overflow-hidden">
      <EmptyStateBody {...props} />
    </Surface>
  );
};

import React from 'react';
import { Surface } from './Surface';

interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  surface?: 'bezel' | 'flat' | 'none';
  className?: string;
}

const EmptyStateBody: React.FC<Omit<EmptyStateProps, 'surface'>> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => (
  <div className={`empty-state ${className}`.trim()}>
    {icon ? <div className="empty-state-icon">{icon}</div> : null}
    <div className="empty-state-copy">
      <h3 className="empty-state-title">{title}</h3>
      {description ? <div className="empty-state-description">{description}</div> : null}
    </div>
    {action ? <div className="empty-state-action">{action}</div> : null}
  </div>
);

export const EmptyState: React.FC<EmptyStateProps> = ({
  surface = 'bezel',
  ...props
}) => {
  if (surface === 'none') {
    return <EmptyStateBody {...props} />;
  }

  return (
    <Surface variant={surface} className="overflow-hidden">
      <EmptyStateBody {...props} />
    </Surface>
  );
};

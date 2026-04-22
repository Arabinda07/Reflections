import React from 'react';

interface AlertProps {
  title?: string;
  description: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  title,
  description,
  icon,
  actions,
  variant = 'info',
  className = '',
}) => {
  return (
    <div className={`alert-panel alert-panel--${variant} ${className}`.trim()} role="alert">
      {icon ? <div className="alert-panel-icon">{icon}</div> : null}
      <div className="alert-panel-copy">
        {title ? <p className="alert-panel-title">{title}</p> : null}
        <div className="alert-panel-description">{description}</div>
      </div>
      {actions ? <div className="alert-panel-actions">{actions}</div> : null}
    </div>
  );
};

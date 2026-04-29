import React from 'react';

interface AlertProps {
  title?: string;
  description: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'inherit' | 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

const ALERT_VARIANT_CLASS: Record<NonNullable<AlertProps['variant']>, string> = {
  inherit: 'alert-panel--inherit',
  info: 'alert-panel--info',
  success: 'alert-panel--success',
  warning: 'alert-panel--warning',
  error: 'alert-panel--error',
};

export const Alert: React.FC<AlertProps> = ({
  title,
  description,
  icon,
  actions,
  variant = 'inherit',
  className = '',
}) => {
  return (
    <div className={`alert-panel ${ALERT_VARIANT_CLASS[variant]} ${className}`.trim()} role="alert">
      {icon ? <div className="alert-panel-icon">{icon}</div> : null}
      <div className="alert-panel-copy">
        {title ? <p className="alert-panel-title">{title}</p> : null}
        <div className="alert-panel-description">{description}</div>
      </div>
      {actions ? <div className="alert-panel-actions">{actions}</div> : null}
    </div>
  );
};

import React from 'react';

interface MetadataPillProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'default' | 'green' | 'orange' | 'red' | 'blue' | 'sage' | 'sky' | 'honey' | 'clay';
  className?: string;
}

export const MetadataPill: React.FC<MetadataPillProps> = ({
  children,
  icon,
  tone = 'default',
  className = '',
}) => {
  return (
    <span className={`metadata-pill metadata-pill--${tone} ${className}`.trim()}>
      {icon ? <span className="metadata-pill-icon">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
};

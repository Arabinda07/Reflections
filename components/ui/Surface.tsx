import React from 'react';

interface SurfaceProps {
  children: React.ReactNode;
  variant?: 'bezel' | 'flat';
  className?: string;
  innerClassName?: string;
}

export const Surface: React.FC<SurfaceProps> = ({
  children,
  variant = 'flat',
  className = '',
  innerClassName = '',
}) => {
  if (variant === 'bezel') {
    return (
      <div className={`surface-bezel ${className}`.trim()}>
        <div className={`surface-bezel-inner ${innerClassName}`.trim()}>{children}</div>
      </div>
    );
  }

  return <div className={`surface-flat ${className}`.trim()}>{children}</div>;
};

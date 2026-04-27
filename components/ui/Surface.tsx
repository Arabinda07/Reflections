import React from 'react';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'bezel' | 'flat' | 'floating';
  innerClassName?: string;
}

export const Surface: React.FC<SurfaceProps> = ({
  children,
  variant = 'flat',
  className = '',
  innerClassName = '',
  ...rest
}) => {
  if (variant === 'bezel') {
    return (
      <div {...rest} className={`surface-bezel ${className}`.trim()}>
        <div className={`surface-bezel-inner ${innerClassName}`.trim()}>{children}</div>
      </div>
    );
  }

  const surfaceClassName = variant === 'floating' ? 'surface-floating' : 'surface-flat';

  return (
    <div {...rest} className={`${surfaceClassName} ${className}`.trim()}>
      {children}
    </div>
  );
};

import React from 'react';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'bezel' | 'flat' | 'floating';
  tone?: 'neutral' | 'sage' | 'sky' | 'honey' | 'clay';
  innerClassName?: string;
}

export const Surface: React.FC<SurfaceProps> = ({
  children,
  variant = 'flat',
  tone = 'neutral',
  className = '',
  innerClassName = '',
  ...rest
}) => {
  const toneClassName = `surface-tone-${tone}`;

  if (variant === 'bezel') {
    return (
      <div {...rest} className={`surface-bezel ${toneClassName} ${className}`.trim()}>
        <div className={`surface-bezel-inner ${innerClassName}`.trim()}>{children}</div>
      </div>
    );
  }

  const surfaceClassName = variant === 'floating' ? 'surface-floating' : 'surface-flat';

  return (
    <div {...rest} className={`${surfaceClassName} ${toneClassName} ${className}`.trim()}>
      {children}
    </div>
  );
};

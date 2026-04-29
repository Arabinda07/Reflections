import React from 'react';
import { SURFACE_TONE_CLASS, type SurfaceTone } from './surfaceTone';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'bezel' | 'flat' | 'floating';
  tone?: SurfaceTone;
  innerClassName?: string;
}

export const Surface: React.FC<SurfaceProps> = ({
  children,
  variant = 'flat',
  tone = 'inherit',
  className = '',
  innerClassName = '',
  ...rest
}) => {
  const toneClassName = SURFACE_TONE_CLASS[tone];

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

import React from 'react';

export type PageContainerScope = 'sage' | 'paper' | 'sky' | 'honey' | 'clay' | 'mixed';

interface PageContainerProps {
  children: React.ReactNode;
  size?: 'app' | 'wide' | 'narrow';
  scope?: PageContainerScope;
  className?: string;
  as?: React.ElementType;
}

const sizeClasses = {
  app: 'page-container',
  wide: 'page-container page-container-wide',
  narrow: 'page-container page-container-narrow',
};

const scopeClasses: Record<PageContainerScope, string> = {
  sage: 'surface-scope-sage page-wash min-h-dvh',
  paper: 'surface-scope-paper page-wash min-h-dvh',
  sky: 'surface-scope-sky page-wash min-h-dvh',
  honey: 'surface-scope-honey page-wash min-h-dvh',
  clay: 'surface-scope-clay page-wash min-h-dvh',
  mixed: 'surface-scope-mixed page-wash min-h-dvh',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  size = 'app',
  scope,
  className = '',
  as: Component = 'div',
}) => {
  const scopeClass = scope ? scopeClasses[scope] : '';
  return <Component className={`${scopeClass} ${sizeClasses[size]} ${className}`.trim()}>{children}</Component>;
};

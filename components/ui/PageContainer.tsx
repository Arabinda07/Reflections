import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  size?: 'app' | 'wide' | 'narrow';
  className?: string;
}

const sizeClasses = {
  app: 'page-container',
  wide: 'page-container page-container-wide',
  narrow: 'page-container page-container-narrow',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  size = 'app',
  className = '',
}) => {
  return <div className={`${sizeClasses[size]} ${className}`.trim()}>{children}</div>;
};

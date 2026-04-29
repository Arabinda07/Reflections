import React from 'react';
import { METADATA_TONE_CLASS, type MetadataTone } from './surfaceTone';

interface MetadataPillProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: MetadataTone;
  className?: string;
}

export const MetadataPill: React.FC<MetadataPillProps> = ({
  children,
  icon,
  tone = 'inherit',
  className = '',
}) => {
  return (
    <span className={`metadata-pill ${METADATA_TONE_CLASS[tone]} ${className}`.trim()}>
      {icon ? <span className="metadata-pill-icon">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
};

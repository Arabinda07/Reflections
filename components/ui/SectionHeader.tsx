import React from 'react';

interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  align?: 'left' | 'center';
  titleAs?: 'h1' | 'h2' | 'h3';
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
  align = 'left',
  titleAs = 'h1',
  className = '',
}) => {
  const rootClassName = [
    'section-header',
    align === 'center' ? 'section-header--center' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const TitleTag = titleAs;

  return (
    <div className={rootClassName}>
      <div className="section-header-row">
        <div className="section-header-copy">
          {eyebrow ? <span className="section-header-eyebrow">{eyebrow}</span> : null}
          <TitleTag className="section-header-title">{title}</TitleTag>
          {description ? <div className="section-header-description">{description}</div> : null}
        </div>
        {actions ? <div className="section-header-actions">{actions}</div> : null}
      </div>
    </div>
  );
};

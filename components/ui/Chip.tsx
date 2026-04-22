import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
  as?: 'button' | 'span';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  title?: string;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  icon,
  active = false,
  as = 'button',
  onClick,
  className = '',
  title,
}) => {
  const classes = ['chip-filter', active ? 'chip-filter--active' : '', className]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {icon ? <span className="chip-filter-icon">{icon}</span> : null}
      <span>{children}</span>
    </>
  );

  if (as === 'span') {
    return (
      <span className={classes} title={title}>
        {content}
      </span>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes} title={title}>
      {content}
    </button>
  );
};

import React from 'react';
import { CaretDown, CaretRight } from '@phosphor-icons/react';

export type GuideRowTone = 'paper' | 'sage' | 'sky' | 'honey' | 'clay';

type GuideRowBaseProps = {
  icon: React.ReactNode;
  label: React.ReactNode;
  title: React.ReactNode;
  titleAs?: 'span' | 'h2' | 'h3' | 'h4';
  description?: React.ReactNode;
  tone?: GuideRowTone;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  rightLabel?: React.ReactNode;
  showCaret?: boolean;
  caret?: 'right' | 'down';
  expanded?: boolean;
  controls?: string;
  ariaLabel?: string;
};

type GuideRowProps = GuideRowBaseProps &
  (
    | {
        as?: 'div';
      }
    | {
        as: 'a';
        href: string;
      }
    | {
        as: 'button';
        onClick: React.MouseEventHandler<HTMLButtonElement>;
      }
    | {
        as: 'summary';
      }
  );

const toneIconClass: Record<GuideRowTone, string> = {
  paper: 'surface-tone-paper',
  sage: 'tone-icon-sage',
  sky: 'tone-icon-sky',
  honey: 'tone-icon-honey',
  clay: 'tone-icon-clay',
};

const getAffordanceIcon = (caret: 'right' | 'down') =>
  caret === 'down' ? <CaretDown size={18} weight="bold" /> : <CaretRight size={18} weight="bold" />;

export const GuideRow: React.FC<GuideRowProps> = (props) => {
  const {
    icon,
    label,
    title,
    titleAs = 'span',
    description,
    tone = 'sage',
    className = '',
    iconClassName = '',
    titleClassName = '',
    rightLabel,
    showCaret = true,
    caret = 'right',
    expanded,
    controls,
    ariaLabel,
  } = props;
  const isInteractive = props.as === 'a' || props.as === 'button' || props.as === 'summary';
  const TitleElement = titleAs;
  const rowClassName = [
    'guide-row',
    `guide-row--${tone}`,
    isInteractive ? 'guide-row--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <span className={`guide-row__icon tone-icon ${toneIconClass[tone]} ${iconClassName}`.trim()} aria-hidden="true">
        {icon}
      </span>
      <span className="guide-row__copy">
        <span className="guide-row__label">{label}</span>
        <TitleElement className={`guide-row__title ${titleClassName}`.trim()}>{title}</TitleElement>
        {description ? <span className="guide-row__description">{description}</span> : null}
      </span>
      {rightLabel ? <span className="guide-row__right-label">{rightLabel}</span> : null}
      {showCaret ? (
        <span
          className={`guide-row__affordance ${expanded ? 'guide-row__affordance--open' : ''}`.trim()}
          aria-hidden="true"
        >
          {getAffordanceIcon(caret)}
        </span>
      ) : null}
    </>
  );

  if (props.as === 'a') {
    return (
      <a href={props.href} aria-label={ariaLabel} className={rowClassName}>
        {content}
      </a>
    );
  }

  if (props.as === 'button') {
    return (
      <button
        type="button"
        onClick={props.onClick}
        aria-expanded={expanded}
        aria-controls={controls}
        aria-label={ariaLabel}
        className={rowClassName}
      >
        {content}
      </button>
    );
  }

  if (props.as === 'summary') {
    return (
      <summary aria-expanded={expanded} aria-controls={controls} aria-label={ariaLabel} className={rowClassName}>
        {content}
      </summary>
    );
  }

  return <div aria-label={ariaLabel} className={rowClassName}>{content}</div>;
};

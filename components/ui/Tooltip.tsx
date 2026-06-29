import React from 'react';

interface TooltipProps {
  label: string;
  placement?: 'top' | 'bottom';
  children: React.ReactNode;
  className?: string;
}

/**
 * Lightweight, token-based tooltip. The trigger keeps its own `aria-label`, so the
 * bubble is `aria-hidden` (no double announcement). Reveal is opacity-only, so it is
 * reduced-motion safe by default.
 */
export const Tooltip: React.FC<TooltipProps> = ({ label, placement = 'top', children, className = '' }) => {
  const position =
    placement === 'top'
      ? 'bottom-full mb-2'
      : 'top-full mt-2';

  return (
    <span className={`group/tooltip relative inline-flex ${className}`.trim()}>
      {children}
      <span
        role="tooltip"
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 ${position} whitespace-nowrap rounded-lg bg-[var(--gray-text)] px-2 py-1 text-ui-xs font-bold text-[var(--bg-color)] opacity-0 shadow-sm transition-opacity duration-150 ease-out-expo group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100`}
      >
        {label}
      </span>
    </span>
  );
};

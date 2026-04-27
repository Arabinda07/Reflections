import React from 'react';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={cx(
        'min-h-[12rem] w-full resize-y rounded-[var(--radius-panel)] border border-border-subtle bg-surface px-5 py-4 font-editor text-[17px] leading-8 text-foreground placeholder:text-gray-light transition-[border-color,box-shadow,background-color] duration-steady focus-visible:border-primary focus-visible:ring-[var(--ring-focus)] disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';

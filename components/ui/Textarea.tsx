import React, { forwardRef, useEffect, useRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Automatically grow to fit content */
  autoResize?: boolean;
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ autoResize = false, label, className = '', style, ...props }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = (el: HTMLTextAreaElement | null) => {
      innerRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    };

    useEffect(() => {
      if (!autoResize || !innerRef.current) return;
      const el = innerRef.current;
      const resize = () => {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      };
      resize();
      el.addEventListener('input', resize);
      return () => el.removeEventListener('input', resize);
    }, [autoResize]);

    return (
      <div className="w-full space-y-2">
        {label ? (
          <label className="ml-1 block text-[11px] font-extrabold text-gray-nav">
            {label}
          </label>
        ) : null}
        <textarea
          ref={setRefs}
          className={`input-surface w-full px-4 py-3 text-[15px] font-medium text-gray-text leading-[1.75] resize-none placeholder:text-gray-nav/30 focus:outline-none focus:ring-2 focus:ring-green/10 focus:border-green/30 transition-all ${className}`}
          style={{ minHeight: '6rem', ...style }}
          {...props}
        />
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

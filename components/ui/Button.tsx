import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'bezel';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading,
  disabled,
  ...props
}, ref) => {
  const baseStyles = "relative inline-flex min-w-0 items-center justify-center whitespace-nowrap font-bold select-none transition-[background-color,border-color,color,box-shadow,transform,filter] duration-300 ease-out-expo motion-reduce:transition-none focus:outline-none disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-px active:scale-[0.98] active:translate-y-0";

  const variants = {
    primary: "border border-transparent bg-green text-white shadow-lg shadow-green/20 hover:bg-green-hover hover:shadow-xl hover:shadow-green/30",
    secondary: "control-surface text-gray-text shadow-none hover:border-green/20 hover:bg-green/5",
    outline: "border border-border/40 bg-transparent text-gray-nav hover:border-green/20 hover:bg-green/5 hover:text-gray-text",
    ghost: "bg-transparent text-gray-nav hover:bg-green/5 hover:text-green",
    danger: "border border-transparent bg-clay text-white shadow-none hover:brightness-105",
    bezel: "surface-bezel p-0 !border-none !bg-transparent group",
  };

  const sizes = {
    sm: "min-h-11 px-3 py-2 text-[13px] rounded-[var(--radius-control)] sm:px-4",
    md: "min-h-12 px-4 py-3 text-[15px] rounded-[var(--radius-control)] sm:px-6",
    lg: "min-h-14 px-5 py-4 text-[16px] rounded-[var(--radius-control)] sm:px-8",
  };

  if (variant === 'bezel') {
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants.bezel} ${className}`}
        disabled={isLoading || disabled}
        {...props}
      >
        <div className="surface-bezel-inner flex items-center justify-center px-6 py-2">
          {isLoading && <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          {children}
        </div>
      </button>
    );
  }

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

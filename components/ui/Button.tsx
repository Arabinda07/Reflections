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
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus:outline-none disabled:opacity-50 disabled:pointer-events-none select-none relative active:scale-[0.98]";

  const variants = {
    primary: "border border-transparent bg-green text-white shadow-lg shadow-green/20 hover:bg-green-hover",
    secondary: "border border-border bg-white dark:bg-[var(--panel-bg)] text-gray-text shadow-sm hover:border-green/20 hover:bg-green/5 dark:hover:bg-white/10",
    outline: "border border-border bg-transparent text-gray-nav hover:border-green/20 hover:bg-green/5 hover:text-gray-text",
    ghost: "bg-transparent text-gray-nav hover:bg-green/5 hover:text-green",
    danger: "border border-transparent bg-red text-white shadow-lg shadow-red/20 hover:brightness-105",
    bezel: "surface-bezel p-0 !border-none !bg-transparent group",
  };

  const sizes = {
    sm: "h-10 px-4 text-[13px] rounded-[var(--radius-control)]",
    md: "h-12 px-6 text-[15px] rounded-[var(--radius-control)]",
    lg: "h-14 px-8 text-[16px] rounded-[var(--radius-control)]",
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

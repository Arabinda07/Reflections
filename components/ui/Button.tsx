import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'ref'> {
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
  whileHover,
  whileTap,
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none select-none relative";

  const variants = {
    primary: "border border-transparent bg-green text-white shadow-none hover:bg-green-hover",
    secondary: "control-surface text-gray-text shadow-none hover:border-green/20 hover:bg-green/5",
    outline: "border border-border/40 bg-transparent text-gray-nav hover:border-green/20 hover:bg-green/5 hover:text-gray-text",
    ghost: "bg-transparent text-gray-nav hover:bg-green/5 hover:text-green",
    danger: "border border-transparent bg-red text-white shadow-none hover:brightness-105",
    bezel: "surface-bezel p-0 !border-none !bg-transparent group",
  };

  const sizes = {
    sm: "h-10 px-4 text-[13px] rounded-[var(--radius-control)]",
    md: "h-12 px-6 text-[15px] rounded-[var(--radius-control)]",
    lg: "h-14 px-8 text-[16px] rounded-[var(--radius-control)]",
  };

  const expoTransition: any = {
    duration: 0.25,
    ease: [0.16, 1, 0.3, 1]
  };

  if (variant === 'bezel') {
    return (
      <motion.button
        ref={ref}
        whileHover={whileHover || { scale: 1.02 }}
        whileTap={whileTap || { scale: 0.98 }}
        transition={expoTransition}
        className={`${baseStyles} ${variants.bezel} ${className}`}
        disabled={isLoading || disabled}
        {...props}
      >
        <div className="surface-bezel-inner flex items-center justify-center px-6 py-2">
          {isLoading && <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          {children as React.ReactNode}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      ref={ref}
      whileHover={whileHover || { scale: 1.02 }}
      whileTap={whileTap || { scale: 0.98 }}
      transition={expoTransition}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children as React.ReactNode}
    </motion.button>
  );
});

Button.displayName = 'Button';

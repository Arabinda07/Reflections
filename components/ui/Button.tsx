import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'liquid' | 'liquid-strong';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading,
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-extrabold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none select-none relative active:translate-y-[4px] active:shadow-none hover:scale-[1.02] hover:brightness-110";
  
  const variants = {
    primary: "bg-green text-white shadow-3d-green",
    secondary: "bg-white border-2 border-border text-blue shadow-3d-gray",
    outline: "border-2 border-border bg-transparent text-gray-nav",
    ghost: "bg-transparent text-gray-nav hover:bg-green/5 hover:text-green",
    danger: "bg-red text-white shadow-3d-red",
    liquid: "liquid-glass text-white",
    'liquid-strong': "liquid-glass-strong text-white",
  };

  const sizes = {
    sm: "h-[36px] px-4 text-[13px] rounded-lg",
    md: "h-[48px] px-6 text-[15px] rounded-xl",
    lg: "h-[56px] px-8 text-[17px] rounded-2xl",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
};
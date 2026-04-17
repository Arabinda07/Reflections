import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'liquid' | 'liquid-strong' | 'green';
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
  const baseStyles = "inline-flex items-center justify-center font-extrabold transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none select-none relative hover:brightness-110 active:brightness-95";
  
  const variants = {
    primary: "bg-blue text-pure-white shadow-sm active:shadow-none translate-y-[-2px] active:translate-y-[0px] transition-all duration-150 ease-out",
    secondary: "bg-white/80 border-2 border-border text-blue shadow-sm liquid-glass",
    outline: "bg-transparent border-2 border-border text-gray-text hover:bg-gray-50",
    ghost: "bg-transparent text-gray-nav hover:bg-gray-100 hover:text-gray-text",
    danger: "bg-red text-pure-white shadow-sm liquid-glass",
    liquid: "liquid-glass text-white",
    'liquid-strong': "liquid-glass-strong text-white",
    green: "bg-green text-pure-white shadow-sm liquid-glass",
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
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'bezel';
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
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus:outline-none disabled:opacity-50 disabled:pointer-events-none select-none relative active:scale-[0.98]";
  
  const variants = {
    primary: "bg-green text-white shadow-lg shadow-green/20 hover:brightness-110",
    secondary: "bg-white dark:bg-zinc-800 border border-border text-gray-text shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700",
    outline: "border border-border bg-transparent text-gray-nav hover:bg-white/5",
    ghost: "bg-transparent text-gray-nav hover:bg-green/5 hover:text-green",
    danger: "bg-red text-white shadow-lg shadow-red/20",
    bezel: "bezel-outer p-0 !border-none !bg-transparent group",
  };

  const sizes = {
    sm: "h-10 px-4 text-[13px] rounded-full",
    md: "h-12 px-6 text-[15px] rounded-full",
    lg: "h-16 px-10 text-[17px] rounded-full",
  };

  if (variant === 'bezel') {
    return (
      <button 
        className={`${baseStyles} ${variants.bezel} ${className}`}
        disabled={isLoading || disabled}
        {...props}
      >
        <div className="bezel-inner flex items-center justify-center px-6 py-2">
          {isLoading && <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          {children}
        </div>
      </button>
    );
  }

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
};
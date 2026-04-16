import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input: React.FC<InputProps> = ({ label, error, icon: Icon, className = '', ...props }) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="ml-1 block text-[11px] font-extrabold uppercase tracking-[2px] text-gray-nav dark:text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-nav z-10 pointer-events-none">
            <Icon size={18} strokeWidth={2.5} />
          </div>
        )}
        <input
          className={`w-full h-[48px] rounded-xl border-2 border-border bg-white px-4 text-[15px] font-semibold text-gray-text dark:text-zinc-100 dark:placeholder:text-zinc-500 placeholder:text-gray-nav placeholder:font-medium transition-all duration-200 focus:outline-none focus:border-blue disabled:cursor-not-allowed disabled:opacity-50 ${
            Icon ? 'pl-11' : ''
          } ${error ? 'border-red focus:border-red' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-bold text-red ml-1">{error}</p>}
    </div>
  );
};
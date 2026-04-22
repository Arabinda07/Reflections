import React from 'react';
import { Icon as PhosphorIcon } from '@phosphor-icons/react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: PhosphorIcon;
}

export const Input: React.FC<InputProps> = ({ label, error, icon: Icon, className = '', ...props }) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label htmlFor={props.id} className="ml-1 block text-[11px] font-extrabold text-gray-nav dark:text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-nav z-10 pointer-events-none flex items-center justify-center">
            <Icon size={20} weight="bold" />

          </div>
        )}
        <input
          className={`w-full h-12 rounded-[var(--radius-control)] border border-border bg-white shadow-sm px-4 text-[15px] font-semibold text-gray-text placeholder:text-gray-nav placeholder:font-medium transition-[border-color,box-shadow,background-color] duration-200 focus:outline-none focus:border-green focus:ring-4 focus:ring-green/10 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--panel-bg)] dark:text-zinc-100 dark:placeholder:text-zinc-500 ${
            Icon ? 'pl-12' : ''
          } ${error ? 'border-red focus:border-red focus:ring-red/10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-bold text-red ml-1">{error}</p>}
    </div>
  );
};

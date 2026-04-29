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
            <Icon size={20} weight="regular" />

          </div>
        )}
        <input
          className={`input-surface w-full h-12 px-4 text-[15px] font-semibold placeholder:text-gray-nav placeholder:font-medium disabled:cursor-not-allowed disabled:opacity-50 focus:border-green focus:ring-2 focus:ring-green/10 ${
            Icon ? 'pl-12' : ''
          } ${error ? 'border-red focus:border-red focus:ring-red/10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-bold text-red ml-1">{error}</p>}
    </div>
  );
};

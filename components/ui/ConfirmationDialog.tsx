import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  variant?: 'danger' | 'primary';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isConfirming = false,
  variant = 'danger'
}) => {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-dark-blue/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-[32px] border-2 border-border bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 liquid-glass-strong">
        <div className="flex flex-col p-8 sm:p-10">
          {/* Icon Header */}
          <div className="flex justify-center mb-6">
            <div className={`h-16 w-16 rounded-[22px] flex items-center justify-center border-2 shadow-sm ${
              variant === 'danger' 
                ? 'bg-red/5 border-red/20 text-red' 
                : 'bg-blue/5 border-blue/20 text-blue'
            } liquid-glass`}>
              {variant === 'danger' ? (
                <AlertCircle size={32} strokeWidth={2.5} />
              ) : (
                <AlertCircle size={32} strokeWidth={2.5} className="rotate-180" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-3 mb-10">
            <h3 className="text-[24px] font-display text-gray-text leading-tight lowercase">
              {title}
            </h3>
            <p className="text-[15px] text-gray-light font-medium leading-relaxed">
              {description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              variant={variant}
              onClick={onConfirm}
              isLoading={isConfirming}
              className="w-full h-14 rounded-2xl shadow-md active:scale-[0.98] text-[16px]"
            >
              {confirmLabel}
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isConfirming}
              className="w-full h-14 rounded-2xl border-2 border-border bg-white/50 text-gray-nav hover:text-gray-text shadow-sm active:scale-[0.98] text-[16px]"
            >
              {cancelLabel}
            </Button>
          </div>
        </div>

        {/* Close Button (X) */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-nav hover:text-gray-text hover:bg-gray-100/50 transition-all duration-300"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

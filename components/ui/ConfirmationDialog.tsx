import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
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
  variant?: 'danger' | 'primary' | 'green';
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
  // Handle escape key and scroll locking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center animate-in fade-in duration-300">
      {/* Heavy Backdrop Overlay for maximum separation */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Card / Bottom Sheet Container */}
      <div className="relative w-full sm:max-w-md overflow-hidden rounded-t-[40px] sm:rounded-[40px] border-t-2 sm:border-2 border-border bg-white shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-500 ease-out-expo">
        
        {/* Mobile Handle (Only visible on mobile) */}
        <div className="sm:hidden flex justify-center pt-4 pb-1">
            <div className="h-1.5 w-12 rounded-full bg-border" />
        </div>

        <div className="flex flex-col p-8 sm:p-12">
          {/* High-Signal Icon Header */}
          <div className="flex justify-center mb-8">
            <div className={`h-24 w-24 rounded-[32px] flex items-center justify-center border-4 shadow-sm ${
              variant === 'danger' 
                ? 'bg-red/10 border-red/20 text-red' 
                : 'bg-blue/10 border-blue/20 text-blue'
            } animate-in zoom-in-50 duration-500 delay-100`}>
              {variant === 'danger' ? (
                <AlertTriangle size={48} strokeWidth={2.5} />
              ) : (
                <AlertTriangle size={48} strokeWidth={2.5} className="rotate-180" />
              )}
            </div>
          </div>

          {/* High-Contrast Typography */}
          <div className="text-center space-y-4 mb-12">
            <h3 className="text-[32px] font-display text-gray-text leading-tight lowercase">
              {title}
            </h3>
            <p className="text-[17px] text-gray-light font-medium leading-relaxed">
              {description}
            </p>
          </div>

          {/* Action Buttons - Massive Touch Targets */}
          <div className="flex flex-col gap-4">
            <Button
              variant={variant}
              onClick={onConfirm}
              isLoading={isConfirming}
              className="w-full h-[72px] rounded-2xl shadow-xl active:scale-[0.98] text-[18px] font-black tracking-tight"
            >
              {confirmLabel}
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isConfirming}
              className="w-full h-[72px] rounded-2xl border-2 border-border bg-white text-gray-nav hover:text-gray-text shadow-sm active:scale-[0.98] text-[18px] font-black"
            >
              {cancelLabel}
            </Button>
          </div>
        </div>

        {/* Desktop Close Button (X) */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-gray-nav hover:text-gray-text hover:bg-gray-100 transition-all duration-300 hidden sm:block"
          aria-label="Close"
        >
          <X size={28} />
        </button>
      </div>
    </div>
  );
};

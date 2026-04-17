import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;

  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  variant?: 'danger' | 'primary';
}

/**
 * ConfirmationDialog
 * 
 * Uses Framer Motion (motion/react) for robust, high-performance transitions.
 * Ensures 100% solid visibility by using var(--panel-bg) directly and bypassing
 * potentially brittle Tailwind transition plugins.
 */
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center">
          {/* Backdrop Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={onClose}
          />
          
          {/* Modal Card / Bottom Sheet */}
          <motion.div 
            initial={{ y: '100%', scale: 1, opacity: 0.5 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: '100%', scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
            className="relative w-full sm:max-w-[320px] overflow-hidden rounded-t-[32px] sm:rounded-[32px] border-t-2 sm:border-2 border-border shadow-2xl z-10"

            style={{ backgroundColor: 'var(--panel-bg)' }}
          >
            {/* Mobile Handle */}
            <div className="sm:hidden flex justify-center pt-4 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-border/40" />
            </div>

            <div className="flex flex-col p-5 sm:p-6">



              {/* High-Contrast Typography (Conditional) */}
              {(title || description) && (
                <div className="text-center space-y-3 mb-8">
                  {title && (
                    <h3 className="text-[28px] font-display text-gray-text leading-tight lowercase font-black" style={{ color: 'var(--gray-text)' }}>
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-[16px] text-gray-light font-medium leading-relaxed" style={{ color: 'var(--gray-light)' }}>
                      {description}
                    </p>
                  )}
                </div>
              )}


              {/* Action Buttons */}
              <div className="flex flex-col gap-4">
                <Button
                  variant={variant}
                  onClick={onConfirm}
                  isLoading={isConfirming}
                  className="w-full h-[64px] rounded-2xl shadow-xl active:scale-[0.98] text-[17px] font-black tracking-tight"
                >
                  {confirmLabel}
                </Button>
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={isConfirming}
                  className="w-full h-[64px] rounded-2xl border-2 border-border bg-white text-gray-nav hover:text-gray-text shadow-sm active:scale-[0.98] text-[17px] font-black"
                >

                  {cancelLabel}
                </Button>
              </div>
            </div>


          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

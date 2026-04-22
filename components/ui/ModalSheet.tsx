import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from '@phosphor-icons/react';

interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  bodyClassName?: string;
  panelClassName?: string;
  hideClose?: boolean;
  closeLabel?: string;
}

const sizeClasses = {
  sm: 'sm:max-w-[360px]',
  md: 'sm:max-w-[460px]',
  lg: 'sm:max-w-[620px]',
  xl: 'sm:max-w-[860px]',
};

export const ModalSheet: React.FC<ModalSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  className = '',
  bodyClassName = '',
  panelClassName = '',
  hideClose = false,
  closeLabel = 'Close dialog',
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 40);

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="modal-sheet-root">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="modal-sheet-backdrop"
            onClick={onClose}
          />

          <div className="modal-sheet-shell">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={`modal-sheet-frame ${sizeClasses[size]} ${className}`.trim()}
            >
              <div className="surface-bezel">
                <div
                  className={`surface-bezel-inner modal-sheet-panel ${panelClassName}`.trim()}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={title ? titleId : undefined}
                  aria-describedby={description ? descriptionId : undefined}
                >
                  <div className="modal-sheet-handle" />

                  {(icon || title || description || !hideClose) && (
                    <div className="modal-sheet-header">
                      <div className="modal-sheet-heading">
                        {icon ? <div className="modal-sheet-icon">{icon}</div> : null}
                        <div className="modal-sheet-copy">
                          {title ? (
                            <h2 id={titleId} className="modal-sheet-title">
                              {title}
                            </h2>
                          ) : null}
                          {description ? (
                            <p id={descriptionId} className="modal-sheet-description">
                              {description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {!hideClose ? (
                        <button
                          ref={closeButtonRef}
                          type="button"
                          onClick={onClose}
                          className="modal-sheet-close"
                          aria-label={closeLabel}
                        >
                          <X size={18} weight="bold" />
                        </button>
                      ) : null}
                    </div>
                  )}

                  <div className={`modal-sheet-body ${bodyClassName}`.trim()}>{children}</div>

                  {footer ? <div className="modal-sheet-footer">{footer}</div> : null}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import { registerAndroidBackAction } from '../../src/native/androidBack';
import { SURFACE_TONE_CLASS, type SurfaceTone } from './surfaceTone';
import './modal-sheet.css';

interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  bodyClassName?: string;
  panelClassName?: string;
  hideClose?: boolean;
  closeLabel?: string;
  mobilePlacement?: 'bottom' | 'center';
  tone?: SurfaceTone;
}

const sizeClasses = {
  sm: 'sm:max-w-[360px]',
  md: 'sm:max-w-[460px]',
  lg: 'sm:max-w-[620px]',
  xl: 'sm:max-w-[860px]',
};

/** Duration (ms) for the exit transition — must match CSS --modal-exit-duration. */
const EXIT_DURATION_MS = 220;

/** Brief delay (ms) before auto-focusing the first element, giving children time to mount. */
const AUTOFOCUS_DELAY_MS = 40;

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
  mobilePlacement = 'bottom',
  tone = 'paper',
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Keep DOM mounted during exit animation
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      return;
    }

    // When closing, delay unmount for exit transition
    const timer = window.setTimeout(() => setMounted(false), EXIT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    return registerAndroidBackAction(() => {
      onCloseRef.current();
      return true;
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add('no-scroll');
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (event.key === 'Tab' && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey && activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const focusTimer = window.setTimeout(() => {
      const preferredAutoFocus = panelRef.current?.querySelector<HTMLElement>(
        '[autofocus], [data-autofocus="true"]',
      );

      if (preferredAutoFocus) {
        preferredAutoFocus.focus();
        return;
      }

      // Only focus the close button if no other element inside the modal is focused yet.
      // This prevents stealing focus from fields that focus themselves during mount.
      if (!panelRef.current?.contains(document.activeElement)) {
        closeButtonRef.current?.focus();
      }
    }, AUTOFOCUS_DELAY_MS);

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('no-scroll');
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  if (typeof document === 'undefined' || !mounted) return null;

  return createPortal(
    <div
      className={`modal-sheet-root ${
        mobilePlacement === 'center' ? 'modal-sheet-root--center' : ''
      } ${isOpen ? 'modal-sheet-root--open' : ''}`.trim()}
    >
      <div
        className="modal-sheet-backdrop"
        onClick={onClose}
      />

      <div className="modal-sheet-shell">
        <div
          className={`modal-sheet-frame ${sizeClasses[size]} ${className}`.trim()}
        >
          <div className={`surface-bezel ${SURFACE_TONE_CLASS[tone]}`}>
            <div
              ref={panelRef}
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
        </div>
      </div>
    </div>,
    document.body,
  );
};

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react/X';
import { registerAndroidBackAction } from '../../src/native/androidBack';
import { SURFACE_TONE_CLASS, type SurfaceTone } from './surfaceTone';
import './modal-sheet.css';

interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  ariaLabel?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  backdropClassName?: string;
  bodyClassName?: string;
  panelClassName?: string;
  panelId?: string;
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
  ariaLabel,
  icon,
  children,
  footer,
  size = 'md',
  className = '',
  backdropClassName = '',
  bodyClassName = '',
  panelClassName = '',
  panelId,
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
  const dragStartYRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Keep DOM mounted during exit animation
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDragOffsetY(0);
      setIsDragging(false);
      setMounted(true);
      return;
    }

    // When closing, delay unmount for exit transition
    const timer = window.setTimeout(() => setMounted(false), EXIT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (mobilePlacement !== 'bottom' || event.pointerType === 'mouse') return;
    dragStartYRef.current = event.clientY;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    setDragOffsetY(Math.max(0, event.clientY - dragStartYRef.current));
  };

  const handleDragEnd = () => {
    if (dragStartYRef.current === null) return;
    const shouldClose = dragOffsetY > 96;
    dragStartYRef.current = null;
    setIsDragging(false);
    setDragOffsetY(0);
    if (shouldClose) {
      onCloseRef.current();
    }
  };

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
        className={`modal-sheet-backdrop ${backdropClassName}`.trim()}
        onClick={onClose}
      />

      <div className="modal-sheet-shell">
        <div
          className={`modal-sheet-frame ${sizeClasses[size]} ${className}`.trim()}
        >
          <div className={`surface-bezel ${SURFACE_TONE_CLASS[tone]}`}>
            <div
              ref={panelRef}
              id={panelId}
              className={`surface-bezel-inner modal-sheet-panel ${
                isDragging ? 'modal-sheet-panel--dragging' : ''
              } ${panelClassName}`.trim()}
              style={dragOffsetY > 0 ? { transform: `translateY(${dragOffsetY}px)` } : undefined}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              aria-label={!title && ariaLabel ? ariaLabel : undefined}
              aria-describedby={description ? descriptionId : undefined}
            >
              <div
                className="modal-sheet-handle"
                onPointerDown={handleDragStart}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                onPointerCancel={handleDragEnd}
              />

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

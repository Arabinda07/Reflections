import React, { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
  /** Runs when the toast times out without the action being taken (e.g. commit a delete). */
  onExpire?: () => void;
}

interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
  isExiting?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant, action?: ToastAction) => void;
}

const ToastContext = React.createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => React.useContext(ToastContext);

const AUTO_DISMISS_MS = 3200;
const ERROR_DISMISS_MS = 7000; // errors need time to read and act on
export const ACTION_DISMISS_MS = 10000; // time to reach an Undo

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-green/20 bg-green/5 text-green',
  info: 'border-sky/20 bg-sky/5 text-sky',
  warning: 'border-honey/20 bg-honey/5 text-honey',
  error: 'border-clay/20 bg-clay/5 text-clay',
};

const ToastItem: React.FC<{ toast: ToastData; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const raf = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const [isPaused, setIsPaused] = useState(false);
  const isError = toast.variant === 'error';

  useEffect(() => {
    if (toast.isExiting || isPaused) return;
    const timer = window.setTimeout(
      () => {
        toast.action?.onExpire?.();
        onDismiss(toast.id);
      },
      isError ? ERROR_DISMISS_MS : toast.action ? ACTION_DISMISS_MS : AUTO_DISMISS_MS,
    );
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss, toast.isExiting, isPaused, isError, toast.action]);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-lg shadow-black/5 backdrop-blur-xl text-btn-sm font-bold ${variantStyles[toast.variant]} transition-[opacity,transform] duration-300 ease-out-expo transform-gpu ${
        isMounted && !toast.isExiting ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
      }`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <span>{toast.message}</span>
      {toast.action ? (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onDismiss(toast.id);
          }}
          className="-my-1.5 -mr-2 min-h-11 min-w-16 rounded-xl border border-current/30 px-4 transition-colors hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          {toast.action.label}
        </button>
      ) : null}
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const idPrefix = useId();
  const counterRef = React.useRef(0);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success', action?: ToastAction) => {
      const id = `${idPrefix}-${++counterRef.current}`;
      setToasts((prev) => {
        // Keep at most 3 plain toasts; never evict one with an action (its
        // onExpire may commit something, like a pending delete).
        const live = prev.filter((t) => !t.isExiting);
        const keptPlain = live.filter((t) => !t.action).slice(-2);
        return [...live.filter((t) => t.action || keptPlain.includes(t)), { id, message, variant, action }];
      });
    },
    [idPrefix],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => 
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );
    
    // Actually remove after animation completes
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[200] flex flex-col items-center gap-2 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:items-end">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
};

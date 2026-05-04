import React, { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

type ToastVariant = 'success' | 'info' | 'warning';

interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  isExiting?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = React.createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => React.useContext(ToastContext);

const AUTO_DISMISS_MS = 3200;

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-green/20 bg-green/5 text-green',
  info: 'border-sky/20 bg-sky/5 text-sky',
  warning: 'border-honey/20 bg-honey/5 text-honey',
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

  useEffect(() => {
    if (toast.isExiting) return;
    const timer = window.setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss, toast.isExiting]);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-lg shadow-black/5 backdrop-blur-xl text-[13px] font-bold ${variantStyles[toast.variant]} transition-all duration-300 ease-out-expo transform-gpu ${
        isMounted && !toast.isExiting ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
      }`}
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const idPrefix = useId();
  const counterRef = React.useRef(0);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = `${idPrefix}-${++counterRef.current}`;
      setToasts((prev) => [...prev.filter(t => !t.isExiting).slice(-2), { id, message, variant }]);
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
          <div className="pointer-events-none fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-2">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
};

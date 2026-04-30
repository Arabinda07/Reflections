import React, { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

type ToastVariant = 'success' | 'info' | 'warning';

interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
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
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-lg shadow-black/5 backdrop-blur-xl text-[13px] font-bold ${variantStyles[toast.variant]}`}
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </motion.div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const idPrefix = useId();
  const counterRef = React.useRef(0);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = `${idPrefix}-${++counterRef.current}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);
    },
    [idPrefix],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="pointer-events-none fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-2">
            <AnimatePresence mode="popLayout">
              {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
};

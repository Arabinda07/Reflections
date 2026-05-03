import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import './overlay-feedback.css';

interface OverlayFeedbackProps {
  isVisible: boolean;
  children: React.ReactNode;
  overlayClassName?: string;
  contentClassName?: string;
  pointerEvents?: 'auto' | 'none';
}

export const OverlayFeedback: React.FC<OverlayFeedbackProps> = ({
  isVisible,
  children,
  overlayClassName = '',
  contentClassName = '',
  pointerEvents = 'auto',
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`overlay-feedback ${overlayClassName}`.trim()}
          style={{ pointerEvents }}
        >
          {contentClassName ? <div className={contentClassName}>{children}</div> : children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

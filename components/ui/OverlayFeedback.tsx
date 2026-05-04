import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [render, setRender] = useState(isVisible);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setRender(true);
      // Ensure the element is mounted before starting the transition
      const frame1 = requestAnimationFrame(() => {
        const frame2 = requestAnimationFrame(() => {
          setAnimateIn(true);
        });
        return () => cancelAnimationFrame(frame2);
      });
      return () => cancelAnimationFrame(frame1);
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => {
        setRender(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!render || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`overlay-feedback ${overlayClassName} ${animateIn ? 'is-visible' : ''}`.trim()}
      style={{ pointerEvents }}
    >
      {contentClassName ? <div className={contentClassName}>{children}</div> : children}
    </div>,
    document.body,
  );
};

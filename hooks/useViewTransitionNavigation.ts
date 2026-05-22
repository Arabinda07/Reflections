import { useCallback } from 'react';
import { type NavigateOptions, type To, useNavigate } from 'react-router-dom';

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished?: Promise<void> };
};

const shouldReduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export const canStartViewTransition = () =>
  typeof document !== 'undefined' &&
  typeof (document as ViewTransitionDocument).startViewTransition === 'function' &&
  !shouldReduceMotion();

export const useViewTransitionNavigation = () => {
  const navigate = useNavigate();

  return useCallback((to: To | number, options?: NavigateOptions) => {
    if (typeof to === 'number') {
      navigate(to);
      return;
    }

    if (!canStartViewTransition()) {
      navigate(to, options);
      return;
    }

    (document as ViewTransitionDocument).startViewTransition?.(() => {
      navigate(to, options);
    });
  }, [navigate]);
};

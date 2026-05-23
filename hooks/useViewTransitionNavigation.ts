import { useCallback } from 'react';
import { type NavigateOptions, type To, useNavigate } from 'react-router-dom';
import { supportsViewTransitions } from './viewTransitionUtils';

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

export const canStartViewTransition = () =>
  supportsViewTransitions();

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

    try {
      (document as ViewTransitionDocument).startViewTransition?.(() => {
        navigate(to, options);
      });
    } catch {
      navigate(to, options);
    }
  }, [navigate]);
};

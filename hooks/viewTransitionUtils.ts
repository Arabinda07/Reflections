type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished?: Promise<void> };
};

type ScopedViewTransitionElement = Element & {
  startViewTransition?: (callback: () => void) => { finished?: Promise<void> };
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export const supportsViewTransitions = () =>
  typeof document !== 'undefined' &&
  typeof (document as ViewTransitionDocument).startViewTransition === 'function' &&
  !prefersReducedMotion();

export const supportsScopedViewTransitions = (element?: Element | null) =>
  Boolean(
    element &&
      typeof (element as ScopedViewTransitionElement).startViewTransition === 'function' &&
      !prefersReducedMotion(),
  );

export const runScopedTransition = (element: Element | null, update: () => void) => {
  if (!supportsScopedViewTransitions(element)) {
    update();
    return;
  }

  (element as ScopedViewTransitionElement).startViewTransition?.(update);
};

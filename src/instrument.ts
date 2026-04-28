import type { ErrorInfo } from 'react';

type SentryModule = typeof import('@sentry/react');
type BrowserEnv = Partial<Record<'VITE_SENTRY_DSN' | 'VITE_APP_VERSION' | 'MODE', string | undefined>>;

let sentryModulePromise: Promise<SentryModule> | null = null;
let initPromise: Promise<boolean> | null = null;
let hasInitialized = false;

const getSentryDsn = (env: BrowserEnv = import.meta.env) => env.VITE_SENTRY_DSN?.trim() || '';

const loadSentry = () => {
  sentryModulePromise ??= import('@sentry/react');
  return sentryModulePromise;
};

export const initSentry = async (env: BrowserEnv = import.meta.env) => {
  const dsn = getSentryDsn(env);
  if (!dsn) {
    return false;
  }

  if (hasInitialized) {
    return true;
  }

  const Sentry = await loadSentry();

  Sentry.init({
    dsn,
    environment: env.MODE,
    release: `reflections@${env.VITE_APP_VERSION || '1.0.0'}`,

    sendDefaultPii: false,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  hasInitialized = true;
  return true;
};

export const scheduleSentryInitialization = (env: BrowserEnv = import.meta.env) => {
  if (!getSentryDsn(env) || typeof window === 'undefined') {
    return;
  }

  const start = () => {
    initPromise ??= initSentry(env).catch((error) => {
      console.warn('[sentry] Deferred initialization failed.', error);
      return false;
    });
  };

  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(start, { timeout: 3000 });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(start, 1200);
  return () => window.clearTimeout(handle);
};

export const captureReactRootError = (error: unknown, errorInfo?: ErrorInfo) => {
  if (!getSentryDsn()) {
    return false;
  }

  const ready = initPromise ??= initSentry();
  void ready
    .then(async (initialized) => {
      if (!initialized) {
        return;
      }

      const Sentry = await loadSentry();
      Sentry.captureException(error, {
        extra: errorInfo?.componentStack
          ? { componentStack: errorInfo.componentStack }
          : undefined,
      });
    })
    .catch((captureError) => {
      console.warn('[sentry] Deferred error capture failed.', captureError);
    });

  return true;
};

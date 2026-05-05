import React, { Suspense, lazy, useEffect, useState } from 'react';

import { PWAInstallProvider } from '../context/PWAInstallContext';
import { ToastProvider } from '../components/ui/Toast';
import { useNativeStatusBar } from '../hooks/useNativeStatusBar';
import { useSync } from '../hooks/useSync';
import { DashboardLayout } from './DashboardLayout';

const LazyVercelVitals = lazy(async () => {
  const [{ Analytics }, { SpeedInsights }] = await Promise.all([
    import('@vercel/analytics/react'),
    import('@vercel/speed-insights/react'),
  ]);

  return {
    default: () => (
      <>
        <Analytics />
        <SpeedInsights />
      </>
    ),
  };
});

const scheduleIdleMount = (callback: () => void) => {
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(callback, { timeout: 3000 });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(callback, 1200);
  return () => window.clearTimeout(handle);
};

const DeferredVercelVitals: React.FC = () => {
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => scheduleIdleMount(() => setShouldMount(true)), []);

  if (!shouldMount) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <LazyVercelVitals />
    </Suspense>
  );
};

const SyncBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useSync();

  return <>{children}</>;
};

export const AuthenticatedAppShell: React.FC = () => {
  useNativeStatusBar();

  return (
    <PWAInstallProvider>

        <ToastProvider>
          <DeferredVercelVitals />
          <SyncBoundary>
            <DashboardLayout />
          </SyncBoundary>
        </ToastProvider>

    </PWAInstallProvider>
  );
};

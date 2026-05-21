import React from 'react';

import { PWAInstallProvider } from '../context/PWAInstallContext';
import { ToastProvider } from '../components/ui/Toast';
import { AppBootstrapper } from '../components/ui/AppBootstrapper';
import { useNativeOAuthListener } from '../hooks/useNativeOAuthListener';
import { useNativeStatusBar } from '../hooks/useNativeStatusBar';
import { useSync } from '../hooks/useSync';
import { DashboardLayout } from './DashboardLayout';

const SyncBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useSync();

  return <>{children}</>;
};

export const AuthenticatedAppShell: React.FC = () => {
  useNativeOAuthListener();
  useNativeStatusBar();

  return (
    <PWAInstallProvider>
      <AppBootstrapper>
        <ToastProvider>
          <SyncBoundary>
            <DashboardLayout />
          </SyncBoundary>
        </ToastProvider>
      </AppBootstrapper>
    </PWAInstallProvider>
  );
};

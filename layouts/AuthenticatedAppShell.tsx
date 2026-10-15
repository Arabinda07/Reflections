import React from 'react';

import { PWAInstallProvider } from '../context/PWAInstallContext';
import { UserModeProvider } from '../context/UserModeContext';
import { UserModeBoundary } from '../components/auth/UserModeBoundary';
import { CryptoProvider } from '../context/CryptoContext';
import { ToastProvider } from '../components/ui/Toast';
import { AppBootstrapper } from '../components/ui/AppBootstrapper';
import { useNativeOAuthListener } from '../hooks/useNativeOAuthListener';
import { useNativeStatusBar } from '../hooks/useNativeStatusBar';
import { useSync } from '../hooks/useSync';
import { useBackgroundPrivacyVeil } from '../hooks/useBackgroundPrivacyVeil';
import { PrivacyVeil } from '../components/ui/PrivacyVeil';
import { DashboardLayout } from './DashboardLayout';
import { RoutePath } from '../types';
import { markLaunchRouted } from '../src/utils/launchRouting';

// A session that starts anywhere but Today has already chosen where to be.
if (typeof window !== 'undefined' && window.location.pathname !== RoutePath.DASHBOARD && window.location.pathname !== RoutePath.HOME) {
  markLaunchRouted();
}

const SyncBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useSync();

  return <>{children}</>;
};

const PrivacyVeilContainer: React.FC = () => {
  const veil = useBackgroundPrivacyVeil();

  return (
    <PrivacyVeil
      isOpen={veil.isVeiled}
      requiresBiometric={veil.requiresBiometric}
      isAuthenticating={veil.isAuthenticating}
      errorMessage={veil.errorMessage}
      onUnlock={veil.unlock}
    />
  );
};

export const AuthenticatedAppShell: React.FC = () => {
  useNativeOAuthListener();
  useNativeStatusBar();

  return (
    <PWAInstallProvider>
      <UserModeProvider>
        <UserModeBoundary>
          <CryptoProvider>
            <AppBootstrapper>
              <ToastProvider>
                <SyncBoundary>
                  <PrivacyVeilContainer />
                  <DashboardLayout />
                </SyncBoundary>
              </ToastProvider>
            </AppBootstrapper>
          </CryptoProvider>
        </UserModeBoundary>
      </UserModeProvider>
    </PWAInstallProvider>
  );
};

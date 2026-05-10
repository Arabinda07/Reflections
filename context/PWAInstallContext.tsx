import React, { createContext, useContext } from 'react';
import { usePWAInstallPrompt } from '../hooks/usePWAInstallPrompt';

interface PWAInstallContextValue {
  /** True when the browser has fired beforeinstallprompt and the app can be installed */
  canInstall: boolean;
  /** True once the user has accepted the install prompt */
  isInstalled: boolean;
  /** Call this to show the native browser install dialog */
  triggerInstall: () => Promise<void>;
}

const PWAInstallContext = createContext<PWAInstallContextValue>({
  canInstall: false,
  isInstalled: false,
  triggerInstall: async () => {},
});

export const usePWAInstall = () => useContext(PWAInstallContext);

export const PWAInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const installPrompt = usePWAInstallPrompt({ debugMissingPrompt: true });

  return (
    <PWAInstallContext.Provider value={installPrompt}>
      {children}
    </PWAInstallContext.Provider>
  );
};

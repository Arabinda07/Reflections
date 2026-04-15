import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface PWAInstallContextValue {
  /** True when the browser has fired beforeinstallprompt and the app can be installed */
  canInstall: boolean;
  /** True once the user has accepted the install prompt */
  isInstalled: boolean;
  /** Call this to show the native install dialog */
  triggerInstall: () => Promise<void>;
}

const PWAInstallContext = createContext<PWAInstallContextValue>({
  canInstall: false,
  isInstalled: false,
  triggerInstall: async () => {},
});

export const usePWAInstall = () => useContext(PWAInstallContext);

export const PWAInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already running in standalone (installed) mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Stop the browser from showing its own mini-infobar
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!installPrompt) return;
    // Show the native install prompt
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      // Only clear the prompt on acceptance — 
      // dismissal should keep the button visible so they can try again later.
      setInstallPrompt(null);
      setIsInstalled(true);
    }
    // Note: on 'dismissed', we intentionally do NOT clear installPrompt.
    // The browser typically fires beforeinstallprompt again on next page load,
    // but for this session we keep canInstall = true so the button stays visible.
  }, [installPrompt]);

  return (
    <PWAInstallContext.Provider
      value={{
        canInstall: installPrompt !== null,
        isInstalled,
        triggerInstall,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
};

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
      // Must preventDefault synchronously to suppress the mini-infobar
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt captured — install button ready');
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] appinstalled event fired');
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Debug: warn in console if the event never arrives
    const debugTimer = setTimeout(() => {
      if (!installPrompt) {
        console.warn(
          '[PWA] beforeinstallprompt has not fired after 5s. ' +
          'Possible causes: (1) App already installed, ' +
          '(2) Chrome engagement threshold not met (2+ visits over 2 days, 30s+ interaction), ' +
          '(3) Manifest/SW validation error — check DevTools → Application → Manifest, ' +
          '(4) Previously dismissed — Chrome has a cooldown before prompting again.'
        );
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(debugTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    console.log(`[PWA] Install prompt outcome: ${outcome}`);

    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
    // On 'dismissed': intentionally keep installPrompt so the button
    // stays visible this session. Browser will re-fire on next session.
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

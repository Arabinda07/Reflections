import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export type InstallMethod = 'native' | 'ios' | null;

interface PWAInstallContextValue {
  /** True when the browser has fired beforeinstallprompt (Android/Chrome/Edge) */
  canInstall: boolean;
  /** True once the user has accepted the install prompt */
  isInstalled: boolean;
  /** 'native' = Android/Chrome prompt, 'ios' = Safari share sheet hint */
  installMethod: InstallMethod;
  /** Call this to show the native install dialog or iOS instructions */
  triggerInstall: () => Promise<void>;
}

const PWAInstallContext = createContext<PWAInstallContextValue>({
  canInstall: false,
  isInstalled: false,
  installMethod: null,
  triggerInstall: async () => {},
});

export const usePWAInstall = () => useContext(PWAInstallContext);

export const PWAInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Detect iOS — Safari never fires beforeinstallprompt
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandaloneMode =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  // Determine install method
  const installMethod: InstallMethod = isInstalled
    ? null
    : installPrompt
    ? 'native'
    : isIOS && !isInStandaloneMode
    ? 'ios'
    : null;

  const canInstall = installMethod !== null;

  useEffect(() => {
    // If already running in standalone mode, mark as installed
    if (isInStandaloneMode) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // ⚠️ Must preventDefault synchronously to capture the event
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt captured — install button is ready');
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] appinstalled event fired');
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Debug: warn if the event was never captured after 5s
    // This helps diagnose "button never appears" issues in production
    const debugTimer = setTimeout(() => {
      if (!installPrompt && !isInStandaloneMode && !isIOS) {
        console.warn(
          '[PWA] beforeinstallprompt has not fired after 5s. ' +
          'Common causes: (1) App already installed, (2) Chrome engagement threshold not met ' +
          '(visit 2+ days and interact for 30s+), (3) Manifest or SW validation error, ' +
          '(4) Previously dismissed — Chrome has a cooldown period before prompting again.'
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
    if (installMethod === 'ios') {
      // iOS: show a clear, friendly instruction modal
      alert(
        '📱 To install Reflections on iOS:\n\n' +
        '1. Tap the Share button (⎦) at the bottom of Safari\n' +
        '2. Scroll down and tap "Add to Home Screen"\n' +
        '3. Tap "Add" in the top-right corner\n\n' +
        'The app will appear on your home screen and work offline.'
      );
      return;
    }

    if (!installPrompt) return;

    // Show the native browser install dialog
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    console.log(`[PWA] User responded to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      // User accepted — clear the prompt and mark as installed
      setInstallPrompt(null);
      setIsInstalled(true);
    }
    // On 'dismissed': intentionally keep installPrompt in state
    // so the button stays visible for this session.
    // The browser will typically re-fire beforeinstallprompt on next session.
  }, [installPrompt, installMethod]);

  return (
    <PWAInstallContext.Provider
      value={{
        canInstall,
        isInstalled,
        installMethod,
        triggerInstall,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
};

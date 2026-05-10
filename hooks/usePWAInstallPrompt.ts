import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

type UsePWAInstallPromptOptions = {
  debugMissingPrompt?: boolean;
};

export const usePWAInstallPrompt = ({
  debugMissingPrompt = false,
}: UsePWAInstallPromptOptions = {}) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      console.debug('[PWA] beforeinstallprompt captured, install button ready');
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      console.debug('[PWA] appinstalled event fired');
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const debugTimer = debugMissingPrompt
      ? window.setTimeout(() => {
          console.warn(
            '[PWA] beforeinstallprompt has not fired after 5s. ' +
              'Possible causes: (1) App already installed, ' +
              '(2) Chrome engagement threshold not met, ' +
              '(3) Manifest/SW validation error, ' +
              '(4) Previously dismissed.',
          );
        }, 5000)
      : undefined;

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);

      if (debugTimer !== undefined) {
        window.clearTimeout(debugTimer);
      }
    };
  }, [debugMissingPrompt]);

  const triggerInstall = useCallback(async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    console.debug(`[PWA] Install prompt outcome: ${outcome}`);

    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  }, [installPrompt]);

  return {
    canInstall: installPrompt !== null,
    isInstalled,
    triggerInstall,
  };
};

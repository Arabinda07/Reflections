import { useCallback, useEffect, useRef, useState } from 'react';
import { mobileRuntime } from '../src/native/mobileRuntime';
import { nativeBiometric } from '../src/native/nativeBiometric';
import { appSecuritySettings } from '../src/native/appSecuritySettings';

export function useBackgroundPrivacyVeil() {
  const [isVeiled, setIsVeiled] = useState(false);
  const [requiresBiometric, setRequiresBiometric] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAuthenticatingRef = useRef(false);

  const unlock = useCallback(async () => {
    if (isAuthenticatingRef.current) return;

    isAuthenticatingRef.current = true;
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const result = await nativeBiometric.authenticate({
        title: 'Unlock Reflections',
        subtitle: 'Verify your identity to access your private journal',
        negativeButtonText: 'Cancel',
      });

      if (result.success) {
        setIsVeiled(false);
        setRequiresBiometric(false);
        setErrorMessage(null);
      } else {
        setErrorMessage(result.error || 'Biometric scan not recognized. Tap to retry.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      isAuthenticatingRef.current = false;
      setIsAuthenticating(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let removeAppListener: (() => void) | null = null;

    const handleBackground = () => {
      if (!appSecuritySettings.isBackgroundVeilEnabled()) return;

      setIsVeiled(true);
      if (appSecuritySettings.isBiometricLockEnabled()) {
        setRequiresBiometric(true);
      }
    };

    const handleForeground = () => {
      if (!isMounted) return;

      if (!appSecuritySettings.isBackgroundVeilEnabled()) {
        setIsVeiled(false);
        setRequiresBiometric(false);
        return;
      }

      if (appSecuritySettings.isBiometricLockEnabled()) {
        setIsVeiled(true);
        setRequiresBiometric(true);
        void unlock();
      } else {
        // Immediate visual privacy lift when biometrics are not required
        setIsVeiled(false);
        setRequiresBiometric(false);
      }
    };

    const setupListeners = async () => {
      if (mobileRuntime.isNativePlatform()) {
        try {
          const { App: CapacitorApp } = await import('@capacitor/app');
          const listener = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            if (!isActive) {
              handleBackground();
            } else {
              handleForeground();
            }
          });
          removeAppListener = () => {
            void listener.remove();
          };
        } catch (e) {
          console.warn('[useBackgroundPrivacyVeil] Failed to attach Capacitor app listener:', e);
        }
      }

      // Also listen to document visibility changes (Web, PWA, test parity)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          handleBackground();
        } else {
          handleForeground();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    };

    let cleanupVisibility: (() => void) | undefined;
    void setupListeners().then((cleanup) => {
      cleanupVisibility = cleanup;
    });

    return () => {
      isMounted = false;
      removeAppListener?.();
      cleanupVisibility?.();
    };
  }, [unlock]);

  return {
    isVeiled,
    requiresBiometric,
    isAuthenticating,
    errorMessage,
    unlock,
  };
}

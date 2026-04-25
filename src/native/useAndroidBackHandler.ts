import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  androidBackActionRegistry,
  canNavigateBackInApp,
  isTopLevelAndroidRoute,
  resolveAndroidBackOutcome,
} from './androidBack';
import { nativeToast } from './nativeToast';

const EXIT_CONFIRMATION_MESSAGE = 'Press back again to exit';

export const useAndroidBackHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const lastExitPromptAtRef = useRef<number | null>(null);

  useEffect(() => {
    let removeListener: (() => Promise<void>) | null = null;

    const setupBackHandler = async () => {
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
        return;
      }

      const listener = await App.addListener('backButton', async () => {
        const now = Date.now();
        const canNavigateBack =
          typeof window !== 'undefined'
            ? canNavigateBackInApp(
                window.history.state as { idx?: unknown } | null,
                window.history.length,
              )
            : false;
        const baseInput = {
          isTopLevelRoute: isTopLevelAndroidRoute(location.pathname),
          canNavigateBack,
          now,
          lastExitPromptAt: lastExitPromptAtRef.current,
        };

        const initialOutcome = resolveAndroidBackOutcome({
          ...baseInput,
          hasRegisteredAction: androidBackActionRegistry.hasHandlers(),
        });

        if (initialOutcome.type === 'registered-action') {
          const handled = await androidBackActionRegistry.runTopmost();
          if (handled) {
            return;
          }
        }

        const fallbackOutcome = resolveAndroidBackOutcome({
          ...baseInput,
          hasRegisteredAction: false,
        });

        if (fallbackOutcome.type === 'navigate-back') {
          navigate(-1);
          return;
        }

        if (fallbackOutcome.type === 'prompt-exit') {
          lastExitPromptAtRef.current = fallbackOutcome.nextExitPromptAt;
          await nativeToast.show({
            text: EXIT_CONFIRMATION_MESSAGE,
          });
          return;
        }

        await App.exitApp();
      });

      removeListener = () => listener.remove();
    };

    void setupBackHandler();

    return () => {
      void removeListener?.();
    };
  }, [location.pathname, navigate]);
};

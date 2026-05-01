import { useEffect } from 'react';
import { RoutePath } from '../types';

/**
 * Listens for native deep-link OAuth callbacks on Capacitor.
 * Handles code exchange, error stashing, analytics, and redirect.
 * No-op on web.
 */
export function useNativeOAuthListener() {
  useEffect(() => {
    let isActive = true;
    let removeNativeUrlListener: (() => Promise<void>) | null = null;
    
    const setupNativeOAuth = async () => {
      const { Capacitor } = await import('@capacitor/core');

      if (!isActive || !Capacitor.isNativePlatform()) {
        return;
      }

      const { App: CapacitorApp } = await import('@capacitor/app');
      const googleOAuth = await import('../src/auth/googleOAuth');
      const analytics = await import('../src/analytics/deferredEvents');
      const { Browser } = await import('@capacitor/browser');

      if (!isActive) {
        return;
      }

      const handleNativeOAuthUrl = async (url: string) => {
        const lastHandled = sessionStorage.getItem(googleOAuth.LAST_HANDLED_NATIVE_URL_KEY);
        if (!url || url === lastHandled) {
          return;
        }

        sessionStorage.setItem(googleOAuth.LAST_HANDLED_NATIVE_URL_KEY, url);
        const pendingSourcePath = googleOAuth.getPendingGoogleAuthPath() || RoutePath.LOGIN;
        const result = await googleOAuth.consumeNativeGoogleOAuthCallback(url);

        if (!isActive || !result.handled) {
          return;
        }

        if ('error' in result) {
          googleOAuth.stashGoogleAuthError(result.error);
          analytics.trackGoogleAuthFailedDeferred({
            sourcePath: pendingSourcePath,
            isNative: true,
            errorCode: result.error,
          });
        }

        const completionPath =
          'error' in result
            ? pendingSourcePath
            : googleOAuth.consumeNativeGoogleAuthSuccessRedirectPath(pendingSourcePath);

        if (!('error' in result)) {
          analytics.trackGoogleAuthSucceededDeferred({
            sourcePath: pendingSourcePath,
            redirectPath: completionPath,
            isNative: true,
          });
        }

        void Browser.close().catch(() => undefined);
        googleOAuth.redirectToAppRoute(completionPath);
      };

      const listener = await CapacitorApp.addListener('appUrlOpen', ({ url }) => {
        void handleNativeOAuthUrl(url);
      });
      removeNativeUrlListener = () => listener.remove();

      const launchData = await CapacitorApp.getLaunchUrl();
      if (launchData?.url) {
        await handleNativeOAuthUrl(launchData.url);
      }
    };

    void setupNativeOAuth();

    return () => {
      isActive = false;
      void removeNativeUrlListener?.();
    };
  }, []);
}

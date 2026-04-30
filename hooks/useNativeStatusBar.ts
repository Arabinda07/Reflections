import { useEffect } from 'react';

/**
 * Synchronizes the Android status bar with the app's light/dark theme.
 * Watches for class changes on <html> and updates bar color accordingly.
 * No-op on web.
 */
export function useNativeStatusBar() {
  useEffect(() => {
    let isActive = true;
    let observer: MutationObserver | null = null;

    const applyNativeChrome = async () => {
      const { Capacitor } = await import('@capacitor/core');

      if (!isActive || !Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
        return;
      }

      const { StatusBar, Style } = await import('@capacitor/status-bar');

      const updateStatusBar = async () => {
        if (!isActive) return;
        const isDark = document.documentElement.classList.contains('dark');
        try {
          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
          await StatusBar.setBackgroundColor({ color: isDark ? '#282a27' : '#f7f8f6' });
          await StatusBar.show();
        } catch (error) {
          console.warn('[native] Failed to align the Android status bar.', error);
        }
      };

      await updateStatusBar();

      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            void updateStatusBar();
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
    };

    void applyNativeChrome();

    return () => {
      isActive = false;
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);
}

import { Capacitor } from '@capacitor/core';

export interface MobileEnvironmentCapabilities {
  isNative: boolean;
  platform: 'android' | 'ios' | 'web';
  hasWebGpu: boolean;
  isLiteRTSupported: boolean;
  maxRecommendedWorkerThreads: number;
}

export const mobileRuntime = {
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  },

  getPlatform(): 'android' | 'ios' | 'web' {
    const platform = Capacitor.getPlatform();
    if (platform === 'android' || platform === 'ios') {
      return platform;
    }
    return 'web';
  },

  isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  },

  isIos(): boolean {
    return Capacitor.getPlatform() === 'ios';
  },

  async probeCapabilities(): Promise<MobileEnvironmentCapabilities> {
    const isNative = Capacitor.isNativePlatform();
    const platform = this.getPlatform();

    let hasWebGpu = false;
    if (typeof navigator !== 'undefined') {
      const nav = navigator as unknown as { gpu?: { requestAdapter?: () => Promise<unknown> } };
      if (nav.gpu && typeof nav.gpu.requestAdapter === 'function') {
        try {
          const adapter = await nav.gpu.requestAdapter();
          hasWebGpu = !!adapter;
        } catch {
          hasWebGpu = false;
        }
      }
    }

    // On native Android, LiteRT is available via the native Capacitor bridge
    const isLiteRTSupported = isNative && platform === 'android';

    // In mobile WebView, avoid heavy multi-threading to prevent OS low memory killer terminations
    const maxRecommendedWorkerThreads = isNative ? 1 : 2;

    return {
      isNative,
      platform,
      hasWebGpu,
      isLiteRTSupported,
      maxRecommendedWorkerThreads,
    };
  },
};

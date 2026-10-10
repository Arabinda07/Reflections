import { nativeSecureStorage } from './nativeSecureStorage';
import { mobileRuntime } from './mobileRuntime';

const BIOMETRIC_LOCK_KEY = 'reflections_biometric_lock_enabled';
const BACKGROUND_VEIL_KEY = 'reflections_privacy_veil_enabled';

const memoryStore = new Map<string, string>();
const listeners = new Set<() => void>();

const getItem = (key: string): string | null => {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage.getItem(key);
  }
  return memoryStore.get(key) ?? null;
};

const setItem = (key: string, value: string): void => {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    globalThis.localStorage.setItem(key, value);
  }
  memoryStore.set(key, value);
};

const notifyListeners = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn('[appSecuritySettings] Listener error:', e);
    }
  });
};

export const appSecuritySettings = {
  isBiometricLockEnabled(): boolean {
    return getItem(BIOMETRIC_LOCK_KEY) === 'true';
  },

  async setBiometricLockEnabled(enabled: boolean): Promise<void> {
    setItem(BIOMETRIC_LOCK_KEY, enabled ? 'true' : 'false');

    if (mobileRuntime.isNativePlatform()) {
      await nativeSecureStorage.set(BIOMETRIC_LOCK_KEY, enabled ? 'true' : 'false');
    }

    notifyListeners();
  },

  isBackgroundVeilEnabled(): boolean {
    const stored = getItem(BACKGROUND_VEIL_KEY);
    return stored === null ? true : stored === 'true';
  },

  async setBackgroundVeilEnabled(enabled: boolean): Promise<void> {
    setItem(BACKGROUND_VEIL_KEY, enabled ? 'true' : 'false');

    if (mobileRuntime.isNativePlatform()) {
      await nativeSecureStorage.set(BACKGROUND_VEIL_KEY, enabled ? 'true' : 'false');
    }

    notifyListeners();
  },

  resetForTesting(): void {
    memoryStore.clear();
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      globalThis.localStorage.clear();
    }
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

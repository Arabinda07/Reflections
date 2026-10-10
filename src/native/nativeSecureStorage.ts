import { Capacitor, registerPlugin } from '@capacitor/core';

interface NativeSecureStoragePlugin {
  set(options: { key: string; value: string }): Promise<{ success: boolean }>;
  get(options: { key: string }): Promise<{ value: string | null }>;
  remove(options: { key: string }): Promise<{ success: boolean }>;
  clear(): Promise<{ success: boolean }>;
}

const NativeSecureStorage = registerPlugin<NativeSecureStoragePlugin>('NativeSecureStorage');

// In-memory fallback map for non-native / test environments
const memoryFallback = new Map<string, string>();

export const nativeSecureStorage = {
  async set(key: string, value: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      memoryFallback.set(key, value);
      return true;
    }

    try {
      const result = await NativeSecureStorage.set({ key, value });
      return result.success;
    } catch (error) {
      console.warn('[nativeSecureStorage] Failed to set secure key in hardware keystore:', error);
      memoryFallback.set(key, value);
      return false;
    }
  },

  async get(key: string): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      return memoryFallback.get(key) ?? null;
    }

    try {
      const result = await NativeSecureStorage.get({ key });
      return result.value ?? null;
    } catch (error) {
      console.warn('[nativeSecureStorage] Failed to read secure key from hardware keystore:', error);
      return memoryFallback.get(key) ?? null;
    }
  },

  async remove(key: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      memoryFallback.delete(key);
      return true;
    }

    try {
      const result = await NativeSecureStorage.remove({ key });
      memoryFallback.delete(key);
      return result.success;
    } catch (error) {
      console.warn('[nativeSecureStorage] Failed to remove secure key from hardware keystore:', error);
      memoryFallback.delete(key);
      return false;
    }
  },

  async clear(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      memoryFallback.clear();
      return true;
    }

    try {
      const result = await NativeSecureStorage.clear();
      memoryFallback.clear();
      return result.success;
    } catch (error) {
      console.warn('[nativeSecureStorage] Failed to clear hardware keystore:', error);
      memoryFallback.clear();
      return false;
    }
  },
};

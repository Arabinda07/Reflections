import type { CryptoSession } from './cryptoService';
import { cryptoService } from './cryptoService';
import { mobileRuntime } from '../src/native/mobileRuntime';
import { nativeSecureStorage } from '../src/native/nativeSecureStorage';

// Opt-in "keep me unlocked on this device" cache.
// On native mobile (ADR 0002): WebCrypto CryptoKey is exported to raw Base64 and stored
// directly in Android Keystore / EncryptedSharedPreferences to resist extraction.
// On web: idb-keyval persists via structured clone.
// Cleared on logout so it never outlives the signed-in user.

const CACHE_KEY = 'reflections-crypto-session';

interface CachedSession {
  userId: string;
  keyId: string;
  dataKey: CryptoKey;
}

interface NativeCachedPayload {
  userId: string;
  keyId: string;
  rawKeyBase64: string;
}

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const cryptoKeyCache = {
  async persist(session: CryptoSession): Promise<void> {
    if (mobileRuntime.isNativePlatform()) {
      const rawBytes = await cryptoService.exportRawDataKey(session.dataKey);
      const payload: NativeCachedPayload = {
        userId: session.userId,
        keyId: session.keyId,
        rawKeyBase64: bytesToBase64(rawBytes),
      };
      await nativeSecureStorage.set(CACHE_KEY, JSON.stringify(payload));
      return;
    }

    const { set } = await import('idb-keyval');
    await set(CACHE_KEY, {
      userId: session.userId,
      keyId: session.keyId,
      dataKey: session.dataKey,
    } satisfies CachedSession);
  },

  async load(userId: string): Promise<CryptoSession | null> {
    if (mobileRuntime.isNativePlatform()) {
      const stored = await nativeSecureStorage.get(CACHE_KEY);
      if (!stored) return null;

      try {
        const parsed = JSON.parse(stored) as Partial<NativeCachedPayload>;
        if (
          !parsed ||
          parsed.userId !== userId ||
          typeof parsed.keyId !== 'string' ||
          typeof parsed.rawKeyBase64 !== 'string'
        ) {
          return null;
        }

        const rawBytes = base64ToBytes(parsed.rawKeyBase64);
        const dataKey = await cryptoService.importRawDataKey(rawBytes);
        return {
          userId: parsed.userId,
          keyId: parsed.keyId,
          dataKey,
        };
      } catch (err) {
        console.warn('[cryptoKeyCache] Failed to deserialize native hardware keystore session:', err);
        return null;
      }
    }

    const { get } = await import('idb-keyval');
    const cached = (await get(CACHE_KEY)) as CachedSession | undefined;
    if (!cached || cached.userId !== userId || !(cached.dataKey instanceof CryptoKey)) {
      return null;
    }
    return { userId: cached.userId, keyId: cached.keyId, dataKey: cached.dataKey };
  },

  async clear(): Promise<void> {
    if (mobileRuntime.isNativePlatform()) {
      await nativeSecureStorage.remove(CACHE_KEY);
      return;
    }

    const { del } = await import('idb-keyval');
    await del(CACHE_KEY);
  },
};

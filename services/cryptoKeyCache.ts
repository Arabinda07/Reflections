import type { CryptoSession } from './cryptoService';

// Opt-in "keep me unlocked on this device" cache. The decrypted data key is a
// Web Crypto CryptoKey, which idb-keyval persists via structured clone (no raw
// export needed). Cleared on logout so it never outlives the signed-in user.
// ponytail: single-record store keyed by userId; fine for one signed-in user.

const CACHE_KEY = 'reflections-crypto-session';

interface CachedSession {
  userId: string;
  keyId: string;
  dataKey: CryptoKey;
}

export const cryptoKeyCache = {
  async persist(session: CryptoSession): Promise<void> {
    const { set } = await import('idb-keyval');
    await set(CACHE_KEY, {
      userId: session.userId,
      keyId: session.keyId,
      dataKey: session.dataKey,
    } satisfies CachedSession);
  },

  async load(userId: string): Promise<CryptoSession | null> {
    const { get } = await import('idb-keyval');
    const cached = (await get(CACHE_KEY)) as CachedSession | undefined;
    if (!cached || cached.userId !== userId || !(cached.dataKey instanceof CryptoKey)) {
      return null;
    }
    return { userId: cached.userId, keyId: cached.keyId, dataKey: cached.dataKey };
  },

  async clear(): Promise<void> {
    const { del } = await import('idb-keyval');
    await del(CACHE_KEY);
  },
};

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { cryptoKeyCache } from './cryptoKeyCache';
import { cryptoService } from './cryptoService';
import { mobileRuntime } from '../src/native/mobileRuntime';
import { nativeSecureStorage } from '../src/native/nativeSecureStorage';

describe('cryptoKeyCache (native mobile hardware keystore serialization)', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await nativeSecureStorage.clear();
  });

  it('serializes CryptoKey to raw base64 and restores functional key in native mode', async () => {
    vi.spyOn(mobileRuntime, 'isNativePlatform').mockReturnValue(true);

    const rawKey = cryptoService.generateRawDataKey();
    const dataKey = await cryptoService.importRawDataKey(rawKey);

    const originalSession = {
      userId: 'user-mobile-42',
      keyId: 'key-envelope-99',
      dataKey,
    };

    // 1. Persist in native mode
    await cryptoKeyCache.persist(originalSession);

    // Verify it stored a JSON payload containing rawKeyBase64 in native secure storage
    const stored = await nativeSecureStorage.get('reflections-crypto-session');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.userId).toBe('user-mobile-42');
    expect(parsed.keyId).toBe('key-envelope-99');
    expect(typeof parsed.rawKeyBase64).toBe('string');
    expect(parsed.rawKeyBase64.length).toBeGreaterThan(0);

    // 2. Load back in native mode
    const loadedSession = await cryptoKeyCache.load('user-mobile-42');
    expect(loadedSession).not.toBeNull();
    expect(loadedSession?.userId).toBe('user-mobile-42');
    expect(loadedSession?.keyId).toBe('key-envelope-99');
    expect(loadedSession?.dataKey).toBeInstanceOf(CryptoKey);

    // 3. Prove cryptographic equivalence: encrypt with original, decrypt with loaded
    const testAad = { table: 'notes', rowId: 'row-1', userId: 'user-mobile-42' };
    const secretMessage = { title: 'Quiet sanctuary', body: 'Personal reflection content' };

    const envelope = await cryptoService.encryptJson(originalSession, testAad, secretMessage);
    const decrypted = await cryptoService.decryptJson(loadedSession!, testAad, envelope);
    expect(decrypted).toEqual(secretMessage);

    // 4. Mismatched user returns null
    const wrongUser = await cryptoKeyCache.load('other-user');
    expect(wrongUser).toBeNull();

    // 5. Clear drops the stored session
    await cryptoKeyCache.clear();
    expect(await cryptoKeyCache.load('user-mobile-42')).toBeNull();
  });
});

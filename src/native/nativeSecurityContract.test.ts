import { describe, expect, it, beforeEach } from 'vitest';
import { nativeSecureStorage } from './nativeSecureStorage';
import { nativeBiometric } from './nativeBiometric';
import { appSecuritySettings } from './appSecuritySettings';

describe('nativeSecurityContract', () => {
  beforeEach(async () => {
    await nativeSecureStorage.clear();
    appSecuritySettings.resetForTesting();
  });

  it('stores, retrieves, and clears secure key-value pairs in memory fallback', async () => {
    const key = 'test-token';
    const value = 'super-secret-token-value-123';

    expect(await nativeSecureStorage.get(key)).toBeNull();

    const stored = await nativeSecureStorage.set(key, value);
    expect(stored).toBe(true);
    expect(await nativeSecureStorage.get(key)).toBe(value);

    const removed = await nativeSecureStorage.remove(key);
    expect(removed).toBe(true);
    expect(await nativeSecureStorage.get(key)).toBeNull();

    await nativeSecureStorage.set('key1', 'val1');
    await nativeSecureStorage.set('key2', 'val2');
    await nativeSecureStorage.clear();
    expect(await nativeSecureStorage.get('key1')).toBeNull();
    expect(await nativeSecureStorage.get('key2')).toBeNull();
  });

  it('provides safe web fallback for biometric capability and authentication', async () => {
    const availability = await nativeBiometric.isAvailable();
    expect(availability.isAvailable).toBe(false);
    expect(availability.hasEnrolledBiometrics).toBe(false);

    const authResult = await nativeBiometric.authenticate();
    expect(authResult.success).toBe(true);
  });

  it('manages biometric lock and privacy veil settings with reactive subscriptions', async () => {
    expect(appSecuritySettings.isBiometricLockEnabled()).toBe(false);
    expect(appSecuritySettings.isBackgroundVeilEnabled()).toBe(true);

    let notifyCount = 0;
    const unsubscribe = appSecuritySettings.subscribe(() => {
      notifyCount += 1;
    });

    await appSecuritySettings.setBiometricLockEnabled(true);
    expect(appSecuritySettings.isBiometricLockEnabled()).toBe(true);
    expect(notifyCount).toBe(1);

    await appSecuritySettings.setBackgroundVeilEnabled(false);
    expect(appSecuritySettings.isBackgroundVeilEnabled()).toBe(false);
    expect(notifyCount).toBe(2);

    unsubscribe();
    await appSecuritySettings.setBiometricLockEnabled(false);
    expect(notifyCount).toBe(2);
  });
});

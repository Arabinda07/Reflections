import { afterEach, describe, expect, it, vi } from 'vitest';
import { keyWrapperPolicy } from './keyWrapperPolicy';
import { cryptoService } from './cryptoService';

const userId = 'user-1';

describe('keyWrapperPolicy', () => {
  afterEach(() => vi.restoreAllMocks());

  it('calibrates wrappers when setup does not provide an iteration count', async () => {
    const calibrate = vi.spyOn(cryptoService, 'calibratePbkdf2Iterations').mockResolvedValue(1_234);
    const bundle = await keyWrapperPolicy.createBundle({
      userId,
      secret: 'private writing password',
    });

    expect(calibrate).toHaveBeenCalledOnce();
    expect(bundle.passphraseWrapper.iterations).toBe(1_234);
    expect(keyWrapperPolicy.toSetupInsertPayload(bundle).kdf_calibration).toEqual({
      targetMs: 500,
      source: 'web_crypto_pbkdf2',
      iterations: 1_234,
    });
  });
  it('accepts a verified account password shorter than eight characters', async () => {
    const bundle = await keyWrapperPolicy.createBundle({
      userId,
      secret: 'six123',
      unlockMethod: 'account_password',
      iterations: 1_000,
    });

    await expect(keyWrapperPolicy.unlockWithPrimarySecret({
      userId,
      secret: 'six123',
      bundle,
    })).resolves.toMatchObject({ userId, keyId: bundle.keyId });
  });

  it('rejects empty account passwords and short private-writing passwords', async () => {
    await expect(keyWrapperPolicy.createBundle({
      userId,
      secret: '',
      unlockMethod: 'account_password',
      iterations: 1_000,
    })).rejects.toThrow('Enter your account password to continue.');

    await expect(keyWrapperPolicy.createBundle({
      userId,
      secret: 'too short',
      unlockMethod: 'private_writing_password',
      iterations: 1_000,
    })).rejects.toThrow('Use at least 12 characters for your private-writing password.');
  });

  it('unlocks account-password users through the account password wrapper', async () => {
    const bundle = await keyWrapperPolicy.createBundle({
      userId,
      secret: 'account password',
      unlockMethod: 'account_password',
      iterations: 1_000,
    });

    expect(bundle.accountPasswordWrapper).toBeTruthy();
    await expect(keyWrapperPolicy.unlockWithPrimarySecret({
      userId,
      secret: 'account password',
      bundle,
    })).resolves.toMatchObject({
      userId,
      keyId: bundle.keyId,
    });
  });

  it('unlocks private-writing-password users through the passphrase wrapper', async () => {
    const bundle = await keyWrapperPolicy.createBundle({
      userId,
      secret: 'private writing password',
      unlockMethod: 'private_writing_password',
      iterations: 1_000,
    });

    expect(bundle.accountPasswordWrapper).toBeNull();
    await expect(keyWrapperPolicy.unlockWithPrimarySecret({
      userId,
      secret: 'private writing password',
      bundle,
    })).resolves.toMatchObject({
      userId,
      keyId: bundle.keyId,
    });
  });

  it('unlocks with recovery phrase regardless of primary unlock method', async () => {
    const bundle = await keyWrapperPolicy.createBundle({
      userId,
      secret: 'account password',
      unlockMethod: 'account_password',
      iterations: 1_000,
    });

    await expect(keyWrapperPolicy.unlockWithRecoveryPhrase({
      userId,
      recoveryPhrase: bundle.recoveryPhrase,
      bundle,
    })).resolves.toMatchObject({
      userId,
      keyId: bundle.keyId,
    });
  });

  it('maps Supabase rows and setup insert payloads', async () => {
    const bundle = await keyWrapperPolicy.createBundle({
      userId,
      secret: 'private writing password',
      unlockMethod: 'private_writing_password',
      iterations: 1_000,
    });
    const mapped = keyWrapperPolicy.mapPersistedBundleRow({
      user_id: userId,
      key_id: bundle.keyId,
      unlock_method: bundle.unlockMethod,
      account_password_wrapper: bundle.accountPasswordWrapper,
      passphrase_wrapper: bundle.passphraseWrapper,
      recovery_wrapper: bundle.recoveryWrapper,
    });
    const payload = keyWrapperPolicy.toSetupInsertPayload(mapped);

    expect(mapped).toMatchObject({ userId, keyId: bundle.keyId });
    expect(payload).toMatchObject({
      user_id: userId,
      key_id: bundle.keyId,
      unlock_method: 'private_writing_password',
      passphrase_wrapper: bundle.passphraseWrapper,
      recovery_wrapper: bundle.recoveryWrapper,
    });
    expect(payload.recovery_verified_at).toEqual(expect.any(String));
    expect(payload.encryption_setup_completed_at).toEqual(expect.any(String));
  });

  it('rewraps account-password bundles from recovery phrase', async () => {
    const bundle = await keyWrapperPolicy.createBundle({
      userId,
      secret: 'old account password',
      unlockMethod: 'account_password',
      iterations: 1_000,
    });

    const result = await keyWrapperPolicy.rewrapAccountPasswordWithRecoveryPhrase({
      userId,
      recoveryPhrase: bundle.recoveryPhrase,
      newAccountPassword: 'new account password',
      bundle,
    });
    const rewrappedBundle = {
      ...bundle,
      accountPasswordWrapper: result.accountPasswordWrapper,
      passphraseWrapper: result.accountPasswordWrapper,
    };

    expect(result.updatePayload).toMatchObject({
      account_password_wrapper: result.accountPasswordWrapper,
      passphrase_wrapper: result.accountPasswordWrapper,
    });
    expect(result.updatePayload.last_rewrapped_at).toEqual(expect.any(String));
    await expect(keyWrapperPolicy.unlockWithPrimarySecret({
      userId,
      secret: 'old account password',
      bundle: rewrappedBundle,
    })).rejects.toThrow(/unlock/i);
    await expect(keyWrapperPolicy.unlockWithPrimarySecret({
      userId,
      secret: 'new account password',
      bundle: rewrappedBundle,
    })).resolves.toMatchObject({
      userId,
      keyId: bundle.keyId,
    });
  });

  it('rewraps account-password bundles from previous password', async () => {
    const bundle = await keyWrapperPolicy.createBundle({
      userId,
      secret: 'previous account password',
      unlockMethod: 'account_password',
      iterations: 1_000,
    });

    const result = await keyWrapperPolicy.rewrapAccountPasswordWithPreviousPassword({
      userId,
      previousAccountPassword: 'previous account password',
      newAccountPassword: 'newer account password',
      bundle,
    });

    await expect(keyWrapperPolicy.unlockWithPrimarySecret({
      userId,
      secret: 'newer account password',
      bundle: {
        ...bundle,
        accountPasswordWrapper: result.accountPasswordWrapper,
        passphraseWrapper: result.accountPasswordWrapper,
      },
    })).resolves.toMatchObject({
      userId,
      keyId: bundle.keyId,
    });
  });

  it('rejects wrong primary secret, recovery phrase, and previous password', async () => {
    const bundle = await keyWrapperPolicy.createBundle({
      userId,
      secret: 'old account password',
      unlockMethod: 'account_password',
      iterations: 1_000,
    });

    await expect(keyWrapperPolicy.unlockWithPrimarySecret({
      userId,
      secret: 'wrong account password',
      bundle,
    })).rejects.toThrow(/unlock/i);
    await expect(keyWrapperPolicy.unlockWithRecoveryPhrase({
      userId,
      recoveryPhrase: 'wrong recovery phrase',
      bundle,
    })).rejects.toThrow(/unlock/i);
    await expect(keyWrapperPolicy.rewrapAccountPasswordWithPreviousPassword({
      userId,
      previousAccountPassword: 'wrong previous password',
      newAccountPassword: 'new account password',
      bundle,
    })).rejects.toThrow(/unlock/i);
  });
});

import { cryptoService, type CryptoSession, type KeyWrapper } from './cryptoService';

export type UnlockMethod = 'account_password' | 'private_writing_password';

export interface UserEncryptionKeyBundle {
  userId: string;
  keyId: string;
  unlockMethod: UnlockMethod;
  accountPasswordWrapper?: KeyWrapper | null;
  passphraseWrapper: KeyWrapper;
  recoveryWrapper: KeyWrapper;
  recoveryPhrase: string;
}

export interface PersistedUserEncryptionKeyBundle {
  userId: string;
  keyId: string;
  unlockMethod: UnlockMethod;
  accountPasswordWrapper?: KeyWrapper | null;
  passphraseWrapper: KeyWrapper;
  recoveryWrapper: KeyWrapper;
}

export interface SupabaseEncryptionKeyRow {
  user_id: string;
  key_id: string;
  unlock_method?: UnlockMethod | null;
  account_password_wrapper?: KeyWrapper | null;
  passphrase_wrapper: KeyWrapper;
  recovery_wrapper: KeyWrapper;
}

export interface AccountPasswordRewrapPayload {
  account_password_wrapper: KeyWrapper;
  passphrase_wrapper: KeyWrapper;
  last_rewrapped_at: string;
}

const DEFAULT_PRIMARY_WRAPPER_ITERATIONS = 210_000;

const getActivePrimaryWrapper = (bundle: PersistedUserEncryptionKeyBundle) => {
  if (bundle.unlockMethod === 'account_password') {
    return bundle.accountPasswordWrapper || bundle.passphraseWrapper;
  }

  return bundle.passphraseWrapper;
};

export const keyWrapperPolicy = {
  async createBundle(input: {
    userId: string;
    secret: string;
    unlockMethod?: UnlockMethod;
    iterations?: number;
  }): Promise<UserEncryptionKeyBundle> {
    const keyId = crypto.randomUUID();
    const rawDataKey = cryptoService.generateRawDataKey();
    const recoveryPhrase = cryptoService.generateRecoveryPhrase();
    const iterations = input.iterations ?? DEFAULT_PRIMARY_WRAPPER_ITERATIONS;
    const unlockMethod = input.unlockMethod ?? 'private_writing_password';
    const primaryWrapper = await cryptoService.wrapRawDataKey(rawDataKey, input.secret, iterations);

    return {
      userId: input.userId,
      keyId,
      unlockMethod,
      accountPasswordWrapper: unlockMethod === 'account_password' ? primaryWrapper : null,
      passphraseWrapper: primaryWrapper,
      recoveryWrapper: await cryptoService.wrapRawDataKey(rawDataKey, recoveryPhrase, iterations),
      recoveryPhrase,
    };
  },

  mapPersistedBundleRow(row: SupabaseEncryptionKeyRow): PersistedUserEncryptionKeyBundle {
    return {
      userId: row.user_id,
      keyId: row.key_id,
      unlockMethod: row.unlock_method || 'private_writing_password',
      accountPasswordWrapper: row.account_password_wrapper ?? null,
      passphraseWrapper: row.passphrase_wrapper,
      recoveryWrapper: row.recovery_wrapper,
    };
  },

  toSetupInsertPayload(bundle: PersistedUserEncryptionKeyBundle) {
    return {
      user_id: bundle.userId,
      key_id: bundle.keyId,
      unlock_method: bundle.unlockMethod,
      account_password_wrapper: bundle.accountPasswordWrapper,
      passphrase_wrapper: bundle.passphraseWrapper,
      recovery_wrapper: bundle.recoveryWrapper,
      recovery_verified_at: new Date().toISOString(),
      encryption_setup_completed_at: new Date().toISOString(),
      kdf_calibration: {
        targetMs: 500,
        source: 'web_crypto_pbkdf2',
      },
    };
  },

  toAccountPasswordRewrapPayload(accountPasswordWrapper: KeyWrapper) {
    return {
      account_password_wrapper: accountPasswordWrapper,
      passphrase_wrapper: accountPasswordWrapper,
      last_rewrapped_at: new Date().toISOString(),
    };
  },

  async unlockWithPrimarySecret(input: {
    userId: string;
    secret: string;
    bundle: PersistedUserEncryptionKeyBundle;
  }): Promise<CryptoSession> {
    return {
      userId: input.userId,
      keyId: input.bundle.keyId,
      dataKey: await cryptoService.unwrapRawDataKeyToCryptoKey(
        getActivePrimaryWrapper(input.bundle),
        input.secret,
      ),
    };
  },

  async unlockWithRecoveryPhrase(input: {
    userId: string;
    recoveryPhrase: string;
    bundle: PersistedUserEncryptionKeyBundle;
  }): Promise<CryptoSession> {
    return {
      userId: input.userId,
      keyId: input.bundle.keyId,
      dataKey: await cryptoService.unwrapRawDataKeyToCryptoKey(
        input.bundle.recoveryWrapper,
        input.recoveryPhrase,
      ),
    };
  },

  async rewrapAccountPasswordWithRecoveryPhrase(input: {
    userId: string;
    recoveryPhrase: string;
    newAccountPassword: string;
    bundle: PersistedUserEncryptionKeyBundle;
    iterations?: number;
  }): Promise<{ session: CryptoSession; accountPasswordWrapper: KeyWrapper; updatePayload: AccountPasswordRewrapPayload }> {
    const iterations = input.iterations ?? input.bundle.recoveryWrapper.iterations;
    const rawDataKey = await cryptoService.unwrapRawDataKey(
      input.bundle.recoveryWrapper,
      input.recoveryPhrase,
    );
    const accountPasswordWrapper = await cryptoService.wrapRawDataKey(
      rawDataKey,
      input.newAccountPassword,
      iterations,
    );

    return {
      session: {
        userId: input.userId,
        keyId: input.bundle.keyId,
        dataKey: await cryptoService.importRawDataKey(rawDataKey),
      },
      accountPasswordWrapper,
      updatePayload: keyWrapperPolicy.toAccountPasswordRewrapPayload(accountPasswordWrapper),
    };
  },

  async rewrapAccountPasswordWithPreviousPassword(input: {
    userId: string;
    previousAccountPassword: string;
    newAccountPassword: string;
    bundle: PersistedUserEncryptionKeyBundle;
    iterations?: number;
  }): Promise<{ session: CryptoSession; accountPasswordWrapper: KeyWrapper; updatePayload: AccountPasswordRewrapPayload }> {
    const wrapper = getActivePrimaryWrapper(input.bundle);
    const iterations = input.iterations ?? wrapper.iterations;
    const rawDataKey = await cryptoService.unwrapRawDataKey(
      wrapper,
      input.previousAccountPassword,
    );
    const accountPasswordWrapper = await cryptoService.wrapRawDataKey(
      rawDataKey,
      input.newAccountPassword,
      iterations,
    );

    return {
      session: {
        userId: input.userId,
        keyId: input.bundle.keyId,
        dataKey: await cryptoService.importRawDataKey(rawDataKey),
      },
      accountPasswordWrapper,
      updatePayload: keyWrapperPolicy.toAccountPasswordRewrapPayload(accountPasswordWrapper),
    };
  },

  async rewrapAccountPasswordFromSession(input: {
    session: CryptoSession;
    newAccountPassword: string;
    iterations?: number;
  }) {
    return cryptoService.wrapRawDataKey(
      await cryptoService.exportRawDataKey(input.session.dataKey),
      input.newAccountPassword,
      input.iterations ?? DEFAULT_PRIMARY_WRAPPER_ITERATIONS,
    );
  },
};

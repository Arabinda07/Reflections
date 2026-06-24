import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../src/supabaseClient';
import { type CryptoSession } from '../services/cryptoService';
import {
  keyWrapperPolicy,
  type PersistedUserEncryptionKeyBundle,
  type UnlockMethod,
  type UserEncryptionKeyBundle,
} from '../services/keyWrapperPolicy';
import { setCurrentCryptoSession } from '../services/cryptoSessionStore';
import { useAuthStore } from '../hooks/useAuthStore';
import {
  zeroKnowledgeMigrationService,
  type MigrationProgress,
} from '../services/zeroKnowledgeMigrationService';

type CryptoStatus = 'loading' | 'setupRequired' | 'locked' | 'migrating' | 'unlocked' | 'error';

interface CryptoContextValue {
  status: CryptoStatus;
  session: CryptoSession | null;
  migrationProgress: MigrationProgress | null;
  recoveryKey: string | null;
  unlockMethod: UnlockMethod | null;
  error: string | null;
  setupEncryption: (secret: string, unlockMethod?: UnlockMethod) => Promise<void>;
  confirmRecoveryKey: (typedRecoveryKey: string) => Promise<void>;
  unlockWithPassphrase: (passphrase: string) => Promise<void>;
  unlockWithRecoveryKey: (recoveryKey: string) => Promise<void>;
  recoverAccountPasswordWithRecoveryKey: (recoveryKey: string, newAccountPassword: string) => Promise<void>;
  recoverAccountPasswordWithPreviousPassword: (previousAccountPassword: string, newAccountPassword: string) => Promise<void>;
  lock: () => void;
}

const CryptoContext = createContext<CryptoContextValue | null>(null);

export const CryptoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const [status, setStatus] = useState<CryptoStatus>('loading');
  const [session, setSession] = useState<CryptoSession | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [bundle, setBundle] = useState<PersistedUserEncryptionKeyBundle | null>(null);
  const [pendingBundle, setPendingBundle] = useState<UserEncryptionKeyBundle | null>(null);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setUnlockedSession = useCallback(async (nextSession: CryptoSession) => {
    setCurrentCryptoSession(nextSession);
    setSession(nextSession);
    setStatus('migrating');
    setMigrationProgress(null);

    try {
      await zeroKnowledgeMigrationService.migrateUserPrivateData(nextSession, setMigrationProgress);
      setStatus('unlocked');
      setError(null);
      setMigrationProgress(null);
    } catch (migrationError) {
      const detail = migrationError instanceof Error ? migrationError.message : 'Unknown migration error.';
      setError(`Private writing could not finish encrypting existing data. Refresh to resume safely. ${detail}`);
      setStatus('error');
    }
  }, []);

  const lock = useCallback(() => {
    setCurrentCryptoSession(null);
    setSession(null);
    setMigrationProgress(null);
    setStatus((current) => (current === 'setupRequired' ? current : 'locked'));
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadBundle = async () => {
      setCurrentCryptoSession(null);
      setSession(null);
      setBundle(null);
      setPendingBundle(null);
      setRecoveryKey(null);
      setMigrationProgress(null);

      if (!user?.id) {
        setStatus('loading');
        return;
      }

      setStatus('loading');
      const { data, error: loadError } = await supabase
        .from('user_encryption_keys')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isActive) return;

      if (loadError) {
        setError(loadError.message);
        setStatus('error');
        return;
      }

      if (!data) {
        setStatus('setupRequired');
        return;
      }

      setBundle(keyWrapperPolicy.mapPersistedBundleRow(data));
      setStatus('locked');
    };

    loadBundle();
    return () => {
      isActive = false;
    };
  }, [user?.id]);

  const setupEncryption = useCallback(async (passphrase: string, unlockMethod: UnlockMethod = 'private_writing_password') => {
    if (!user?.id) throw new Error('Sign in before setting up encryption.');

    const createdBundle = await keyWrapperPolicy.createBundle({
      userId: user.id,
      secret: passphrase,
      unlockMethod,
    });
    setPendingBundle(createdBundle);
    setRecoveryKey(createdBundle.recoveryPhrase);
    setError(null);
  }, [user?.id]);

  const confirmRecoveryKey = useCallback(async (typedRecoveryKey: string) => {
    if (!pendingBundle) throw new Error('Create an encryption bundle before confirming recovery.');
    if (typedRecoveryKey.trim() !== pendingBundle.recoveryPhrase) {
      throw new Error('Recovery key confirmation did not match.');
    }

    const { error: insertError } = await supabase
      .from('user_encryption_keys')
      .insert(keyWrapperPolicy.toSetupInsertPayload(pendingBundle));

    if (insertError) throw insertError;

    const nextSession = await keyWrapperPolicy.unlockWithRecoveryPhrase({
      userId: pendingBundle.userId,
      recoveryPhrase: pendingBundle.recoveryPhrase,
      bundle: pendingBundle,
    });
    setBundle(pendingBundle);
    setPendingBundle(null);
    setRecoveryKey(null);
    await setUnlockedSession(nextSession);
  }, [pendingBundle, setUnlockedSession]);

  const unlockWithPassphrase = useCallback(async (passphrase: string) => {
    if (!user?.id || !bundle) throw new Error('Encryption is not set up for this account.');
    await setUnlockedSession(await keyWrapperPolicy.unlockWithPrimarySecret({
      userId: user.id,
      secret: passphrase,
      bundle,
    }));
  }, [bundle, setUnlockedSession, user?.id]);

  const unlockWithRecoveryKey = useCallback(async (typedRecoveryKey: string) => {
    if (!user?.id || !bundle) throw new Error('Encryption is not set up for this account.');
    await setUnlockedSession(await keyWrapperPolicy.unlockWithRecoveryPhrase({
      userId: user.id,
      recoveryPhrase: typedRecoveryKey,
      bundle,
    }));
  }, [bundle, setUnlockedSession, user?.id]);

  const persistAccountPasswordRewrap = useCallback(async (input: {
    accountPasswordWrapper: NonNullable<PersistedUserEncryptionKeyBundle['accountPasswordWrapper']>;
    updatePayload: ReturnType<typeof keyWrapperPolicy.toAccountPasswordRewrapPayload>;
  }) => {
    if (!user?.id || !bundle) {
      throw new Error('Encryption is not set up for this account.');
    }

    const { error: updateError } = await supabase
      .from('user_encryption_keys')
      .update(input.updatePayload)
      .eq('user_id', user.id)
      .eq('key_id', bundle.keyId);

    if (updateError) throw updateError;

    const nextBundle = {
      ...bundle,
      accountPasswordWrapper: input.accountPasswordWrapper,
      passphraseWrapper: input.accountPasswordWrapper,
    };
    setBundle(nextBundle);
    return nextBundle;
  }, [bundle, user?.id]);

  const recoverAccountPasswordWithRecoveryKey = useCallback(async (
    typedRecoveryKey: string,
    newAccountPassword: string,
  ) => {
    if (!user?.id || !bundle) throw new Error('Encryption is not set up for this account.');
    if (bundle.unlockMethod !== 'account_password') {
      throw new Error('This account uses a separate private-writing password.');
    }

    const result = await keyWrapperPolicy.rewrapAccountPasswordWithRecoveryPhrase({
      userId: user.id,
      recoveryPhrase: typedRecoveryKey,
      newAccountPassword,
      bundle,
    });
    await persistAccountPasswordRewrap(result);
    await setUnlockedSession(result.session);
  }, [bundle, persistAccountPasswordRewrap, setUnlockedSession, user?.id]);

  const recoverAccountPasswordWithPreviousPassword = useCallback(async (
    previousAccountPassword: string,
    newAccountPassword: string,
  ) => {
    if (!user?.id || !bundle) throw new Error('Encryption is not set up for this account.');
    if (bundle.unlockMethod !== 'account_password') {
      throw new Error('This account uses a separate private-writing password.');
    }

    const result = await keyWrapperPolicy.rewrapAccountPasswordWithPreviousPassword({
      userId: user.id,
      previousAccountPassword,
      newAccountPassword,
      bundle,
    });
    await persistAccountPasswordRewrap(result);
    await setUnlockedSession(result.session);
  }, [bundle, persistAccountPasswordRewrap, setUnlockedSession, user?.id]);

  const value = useMemo<CryptoContextValue>(() => ({
    status,
    session,
    migrationProgress,
    recoveryKey,
    unlockMethod: bundle?.unlockMethod ?? pendingBundle?.unlockMethod ?? null,
    error,
    setupEncryption,
    confirmRecoveryKey,
    unlockWithPassphrase,
    unlockWithRecoveryKey,
    recoverAccountPasswordWithRecoveryKey,
    recoverAccountPasswordWithPreviousPassword,
    lock,
  }), [
    confirmRecoveryKey,
    error,
    lock,
    migrationProgress,
    bundle?.unlockMethod,
    pendingBundle?.unlockMethod,
    recoverAccountPasswordWithPreviousPassword,
    recoverAccountPasswordWithRecoveryKey,
    recoveryKey,
    session,
    setupEncryption,
    status,
    unlockWithPassphrase,
    unlockWithRecoveryKey,
  ]);

  return <CryptoContext.Provider value={value}>{children}</CryptoContext.Provider>;
};

export const useCrypto = () => {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error('useCrypto must be used inside CryptoProvider.');
  }
  return context;
};

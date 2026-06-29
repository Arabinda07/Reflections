import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../src/supabaseClient';
import { type CryptoSession } from '../services/cryptoService';
import {
  keyWrapperPolicy,
  type EncryptionMigrationState,
  type PersistedUserEncryptionKeyBundle,
  type UnlockMethod,
  type UserEncryptionKeyBundle,
} from '../services/keyWrapperPolicy';
import { setCurrentCryptoSession } from '../services/cryptoSessionStore';
import { cryptoKeyCache } from '../services/cryptoKeyCache';
import {
  consumePendingAccountPassword,
  hasPendingAccountPassword,
} from '../src/auth/accountPasswordHandoff';
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
  justCompletedSetup: boolean;
  clearJustCompletedSetup: () => void;
  setupEncryption: (secret: string, unlockMethod?: UnlockMethod) => Promise<void>;
  confirmRecoveryKey: (typedRecoveryKey: string) => Promise<void>;
  unlockWithPassphrase: (passphrase: string, remember?: boolean) => Promise<void>;
  unlockWithRecoveryKey: (recoveryKey: string, remember?: boolean) => Promise<void>;
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
  // Durable across the PrivateDataGate remount that the migrating -> unlocked
  // transition triggers, so onboarding can show the "ready" screen once.
  const [justCompletedSetup, setJustCompletedSetup] = useState(false);
  const clearJustCompletedSetup = useCallback(() => setJustCompletedSetup(false), []);
  const setUnlockedSession = useCallback(async (
    nextSession: CryptoSession,
    migrationState: EncryptionMigrationState,
  ) => {
    setCurrentCryptoSession(nextSession);
    setSession(nextSession);
    if (migrationState === 'plaintext_cleared') {
      setStatus('unlocked');
      setError(null);
      setMigrationProgress(null);
      return;
    }
    setStatus('migrating');
    setMigrationProgress(null);

    try {
      await zeroKnowledgeMigrationService.migrateUserPrivateData(nextSession, setMigrationProgress);
      const { error: migrationStateError } = await supabase
        .from('user_encryption_keys')
        .update({ migration_state: 'plaintext_cleared' })
        .eq('user_id', nextSession.userId)
        .eq('key_id', nextSession.keyId);
      if (migrationStateError) throw migrationStateError;
      setBundle((current) => current ? { ...current, migrationState: 'plaintext_cleared' } : current);
      setStatus('unlocked');
      setError(null);
      setMigrationProgress(null);
    } catch (migrationError) {
      setCurrentCryptoSession(null);
      setSession(null);
      const detail = migrationError instanceof Error ? migrationError.message : 'Unknown migration error.';
      setError(`Private writing could not finish encrypting existing data. Refresh to resume safely. ${detail}`);
      setStatus('error');
    }
  }, []);

  const lock = useCallback(() => {
    void cryptoKeyCache.clear();
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
        // No signed-in user (initial load or just-logged-out): drop any cached
        // "keep me unlocked" key so it never outlives the session.
        await cryptoKeyCache.clear();
        if (!isActive) return;
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

      const mappedBundle = keyWrapperPolicy.mapPersistedBundleRow(data);
      setBundle(mappedBundle);

      // If the user opted to stay unlocked on this device, restore the cached
      // data key and skip the gate. Only safe once migration has finished.
      if (mappedBundle.migrationState === 'plaintext_cleared') {
        const cachedSession = await cryptoKeyCache.load(user.id);
        if (!isActive) return;
        if (cachedSession && cachedSession.keyId === mappedBundle.keyId) {
          setCurrentCryptoSession(cachedSession);
          setSession(cachedSession);
          setStatus('unlocked');
          return;
        }

        // Account-password users just typed the exact password that derives the
        // key at login (held briefly in the volatile handoff). Reuse it to skip
        // the redundant unlock prompt instead of asking again.
        if (mappedBundle.unlockMethod === 'account_password' && hasPendingAccountPassword(user.id)) {
          const pending = consumePendingAccountPassword(user.id);
          if (pending) {
            try {
              const nextSession = await keyWrapperPolicy.unlockWithPrimarySecret({
                userId: user.id,
                secret: pending,
                bundle: mappedBundle,
              });
              if (!isActive) return;
              setCurrentCryptoSession(nextSession);
              setSession(nextSession);
              setStatus('unlocked');
              return;
            } catch {
              // Stale stash (e.g. account password changed after setup) — fall
              // through to the gate so the user can unlock or recover.
            }
          }
        }
      }

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
    setJustCompletedSetup(true);
    await setUnlockedSession(nextSession, pendingBundle.migrationState);
  }, [pendingBundle, setUnlockedSession]);

  const unlockWithPassphrase = useCallback(async (passphrase: string, remember = false) => {
    if (!user?.id || !bundle) throw new Error('Encryption is not set up for this account.');
    const nextSession = await keyWrapperPolicy.unlockWithPrimarySecret({
      userId: user.id,
      secret: passphrase,
      bundle,
    });
    await setUnlockedSession(nextSession, bundle.migrationState);
    if (remember) await cryptoKeyCache.persist(nextSession);
  }, [bundle, setUnlockedSession, user?.id]);

  const unlockWithRecoveryKey = useCallback(async (typedRecoveryKey: string, remember = false) => {
    if (!user?.id || !bundle) throw new Error('Encryption is not set up for this account.');
    const nextSession = await keyWrapperPolicy.unlockWithRecoveryPhrase({
      userId: user.id,
      recoveryPhrase: typedRecoveryKey,
      bundle,
    });
    await setUnlockedSession(nextSession, bundle.migrationState);
    if (remember) await cryptoKeyCache.persist(nextSession);
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
    await setUnlockedSession(result.session, bundle.migrationState);
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
    await setUnlockedSession(result.session, bundle.migrationState);
  }, [bundle, persistAccountPasswordRewrap, setUnlockedSession, user?.id]);

  const value = useMemo<CryptoContextValue>(() => ({
    status,
    session,
    migrationProgress,
    recoveryKey,
    unlockMethod: bundle?.unlockMethod ?? pendingBundle?.unlockMethod ?? null,
    error,
    justCompletedSetup,
    clearJustCompletedSetup,
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
    justCompletedSetup,
    clearJustCompletedSetup,
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

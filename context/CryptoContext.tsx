import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../src/supabaseClient';
import {
  cryptoService,
  type CryptoSession,
  type PersistedUserEncryptionKeyBundle,
  type UserEncryptionKeyBundle,
} from '../services/cryptoService';
import { setCurrentCryptoSession } from '../services/cryptoSessionStore';
import { useAuthStore } from '../hooks/useAuthStore';
import { zeroKnowledgeMigrationService } from '../services/zeroKnowledgeMigrationService';

type CryptoStatus = 'loading' | 'setupRequired' | 'locked' | 'migrating' | 'unlocked' | 'error';

interface CryptoContextValue {
  status: CryptoStatus;
  session: CryptoSession | null;
  recoveryKey: string | null;
  error: string | null;
  setupEncryption: (passphrase: string) => Promise<void>;
  confirmRecoveryKey: (typedRecoveryKey: string) => Promise<void>;
  unlockWithPassphrase: (passphrase: string) => Promise<void>;
  unlockWithRecoveryKey: (recoveryKey: string) => Promise<void>;
  lock: () => void;
}

const CryptoContext = createContext<CryptoContextValue | null>(null);

const toPersistedBundle = (bundle: UserEncryptionKeyBundle): PersistedUserEncryptionKeyBundle => ({
  userId: bundle.userId,
  keyId: bundle.keyId,
  passphraseWrapper: bundle.passphraseWrapper,
  recoveryWrapper: bundle.recoveryWrapper,
});

const mapKeyBundleRow = (row: any): PersistedUserEncryptionKeyBundle => ({
  userId: row.user_id,
  keyId: row.key_id,
  passphraseWrapper: row.passphrase_wrapper,
  recoveryWrapper: row.recovery_wrapper,
});

export const CryptoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const [status, setStatus] = useState<CryptoStatus>('loading');
  const [session, setSession] = useState<CryptoSession | null>(null);
  const [bundle, setBundle] = useState<PersistedUserEncryptionKeyBundle | null>(null);
  const [pendingBundle, setPendingBundle] = useState<UserEncryptionKeyBundle | null>(null);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setUnlockedSession = useCallback(async (nextSession: CryptoSession) => {
    setCurrentCryptoSession(nextSession);
    setSession(nextSession);
    setStatus('migrating');
    await zeroKnowledgeMigrationService.migrateUserPrivateData(nextSession);
    setStatus('unlocked');
    setError(null);
  }, []);

  const lock = useCallback(() => {
    setCurrentCryptoSession(null);
    setSession(null);
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

      setBundle(mapKeyBundleRow(data));
      setStatus('locked');
    };

    loadBundle();
    return () => {
      isActive = false;
    };
  }, [user?.id]);

  const setupEncryption = useCallback(async (passphrase: string) => {
    if (!user?.id) throw new Error('Sign in before setting up encryption.');
    if (passphrase.trim().length < 12) {
      throw new Error('Use at least 12 characters for your encryption passphrase.');
    }

    const createdBundle = await cryptoService.createKeyBundle({
      userId: user.id,
      passphrase,
    });
    setPendingBundle(createdBundle);
    setRecoveryKey(createdBundle.recoveryKey);
    setError(null);
  }, [user?.id]);

  const confirmRecoveryKey = useCallback(async (typedRecoveryKey: string) => {
    if (!pendingBundle) throw new Error('Create an encryption bundle before confirming recovery.');
    if (typedRecoveryKey.trim() !== pendingBundle.recoveryKey) {
      throw new Error('Recovery key confirmation did not match.');
    }

    const persistedBundle = toPersistedBundle(pendingBundle);
    const { error: insertError } = await supabase
      .from('user_encryption_keys')
      .insert({
        user_id: persistedBundle.userId,
        key_id: persistedBundle.keyId,
        passphrase_wrapper: persistedBundle.passphraseWrapper,
        recovery_wrapper: persistedBundle.recoveryWrapper,
        kdf_calibration: {
          targetMs: 500,
          source: 'web_crypto_pbkdf2',
        },
      });

    if (insertError) throw insertError;

    const nextSession = await cryptoService.unlockWithRecoveryKey({
      userId: persistedBundle.userId,
      recoveryKey: pendingBundle.recoveryKey,
      bundle: persistedBundle,
    });
    setBundle(persistedBundle);
    setPendingBundle(null);
    setRecoveryKey(null);
    await setUnlockedSession(nextSession);
  }, [pendingBundle, setUnlockedSession]);

  const unlockWithPassphrase = useCallback(async (passphrase: string) => {
    if (!user?.id || !bundle) throw new Error('Encryption is not set up for this account.');
    await setUnlockedSession(await cryptoService.unlockWithPassphrase({
      userId: user.id,
      passphrase,
      bundle,
    }));
  }, [bundle, setUnlockedSession, user?.id]);

  const unlockWithRecoveryKey = useCallback(async (typedRecoveryKey: string) => {
    if (!user?.id || !bundle) throw new Error('Encryption is not set up for this account.');
    await setUnlockedSession(await cryptoService.unlockWithRecoveryKey({
      userId: user.id,
      recoveryKey: typedRecoveryKey,
      bundle,
    }));
  }, [bundle, setUnlockedSession, user?.id]);

  const value = useMemo<CryptoContextValue>(() => ({
    status,
    session,
    recoveryKey,
    error,
    setupEncryption,
    confirmRecoveryKey,
    unlockWithPassphrase,
    unlockWithRecoveryKey,
    lock,
  }), [
    confirmRecoveryKey,
    error,
    lock,
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

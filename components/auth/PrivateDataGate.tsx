import React, { useState } from 'react';
import { useCrypto } from '../../context/CryptoContext';
import { RouteLoadingFrame } from '../ui/RouteLoadingFrame';

const panelClassName =
  'surface-scope-paper page-wash flex min-h-[100dvh] items-center justify-center bg-body px-4 py-10 text-primary';
const cardClassName =
  'w-full max-w-lg rounded-sm border border-border bg-surface/95 p-6 shadow-card';
const inputClassName =
  'w-full rounded-sm border border-border bg-white px-3 py-3 text-sm text-primary outline-none focus:border-primary';
const buttonClassName =
  'rounded-sm bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButtonClassName =
  'rounded-sm border border-border px-4 py-3 text-sm font-semibold text-primary transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50';

const CryptoShell: React.FC<{ children: React.ReactNode; title: string; description: string }> = ({
  children,
  title,
  description,
}) => (
  <div className={panelClassName}>
    <section className={cardClassName} aria-labelledby="private-data-title">
      <p className="label-caps mb-3 text-gray-nav">Private writing</p>
      <h1 id="private-data-title" className="text-2xl font-semibold text-primary">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-gray-text">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  </div>
);

const UnlockPanel: React.FC = () => {
  const { unlockWithPassphrase, unlockWithRecoveryKey } = useCrypto();
  const [passphrase, setPassphrase] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (mode: 'passphrase' | 'recovery') => {
    setIsSubmitting(true);
    setError('');
    try {
      if (mode === 'passphrase') {
        await unlockWithPassphrase(passphrase);
      } else {
        await unlockWithRecoveryKey(recoveryKey);
      }
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : 'Unable to unlock private writing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CryptoShell
      title="Unlock your private writing"
      description="Your account is signed in, but your notes, moods, letters, attachments, and Life Wiki stay encrypted until you unlock them on this device."
    >
      <div className="space-y-4">
        <input
          className={inputClassName}
          type="password"
          autoComplete="current-password"
          placeholder="Encryption passphrase"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
        />
        <button className={buttonClassName} disabled={isSubmitting || !passphrase} onClick={() => submit('passphrase')}>
          Unlock
        </button>
        <div className="border-t border-border pt-4">
          <input
            className={inputClassName}
            type="password"
            autoComplete="off"
            placeholder="Recovery key"
            value={recoveryKey}
            onChange={(event) => setRecoveryKey(event.target.value)}
          />
          <button className={`${secondaryButtonClassName} mt-3`} disabled={isSubmitting || !recoveryKey} onClick={() => submit('recovery')}>
            Unlock with recovery key
          </button>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    </CryptoShell>
  );
};

const SetupPanel: React.FC = () => {
  const { setupEncryption, confirmRecoveryKey, recoveryKey } = useCrypto();
  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [typedRecoveryKey, setTypedRecoveryKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBundle = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      if (passphrase !== confirmation) throw new Error('Passphrases do not match.');
      await setupEncryption(passphrase);
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : 'Unable to set up encryption.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirm = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await confirmRecoveryKey(typedRecoveryKey);
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Unable to confirm recovery key.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (recoveryKey) {
    return (
      <CryptoShell
        title="Save your recovery key"
        description="This key is shown once. It can unlock your writing if the passphrase is lost; support cannot recover it."
      >
        <div className="space-y-4">
          <code className="block rounded-sm border border-border bg-surface-muted p-3 text-sm break-all">{recoveryKey}</code>
          <input
            className={inputClassName}
            autoComplete="off"
            placeholder="Type the recovery key to confirm"
            value={typedRecoveryKey}
            onChange={(event) => setTypedRecoveryKey(event.target.value)}
          />
          <button className={buttonClassName} disabled={isSubmitting || !typedRecoveryKey} onClick={confirm}>
            Confirm and unlock
          </button>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>
      </CryptoShell>
    );
  }

  return (
    <CryptoShell
      title="Set up private writing encryption"
      description="Create a separate encryption passphrase. It is not your login password and never leaves this device as plaintext."
    >
      <div className="space-y-4">
        <input
          className={inputClassName}
          type="password"
          autoComplete="new-password"
          placeholder="Encryption passphrase"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
        />
        <input
          className={inputClassName}
          type="password"
          autoComplete="new-password"
          placeholder="Confirm passphrase"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
        <button className={buttonClassName} disabled={isSubmitting || !passphrase || !confirmation} onClick={createBundle}>
          Create encryption key
        </button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    </CryptoShell>
  );
};

export const PrivateDataGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, error } = useCrypto();

  if (status === 'loading' || status === 'migrating') return <RouteLoadingFrame className="surface-scope-paper page-wash min-h-[100dvh] bg-body" />;
  if (status === 'setupRequired') return <SetupPanel />;
  if (status === 'locked') return <UnlockPanel />;
  if (status === 'error') {
    return (
      <CryptoShell
        title="Private writing is unavailable"
        description={error || 'Encryption settings could not be loaded. Account settings remain available.'}
      >
        <p className="text-sm text-gray-text">Try refreshing after your connection is restored.</p>
      </CryptoShell>
    );
  }

  return <>{children}</>;
};

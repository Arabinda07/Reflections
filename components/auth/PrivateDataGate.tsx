import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCrypto } from '../../context/CryptoContext';
import { RouteLoadingFrame } from '../ui/RouteLoadingFrame';
import { RoutePath } from '../../types';

const panelClassName =
  'surface-scope-paper page-wash flex min-h-[100dvh] items-center justify-center bg-body px-4 py-10 text-primary';
const cardClassName =
  'w-full max-w-lg rounded-sm border border-border bg-surface/95 p-6 shadow-card';
const inputClassName =
  'input-surface w-full rounded-sm px-3 py-3 text-sm text-primary outline-none focus:border-primary';
const buttonClassName =
  'inline-flex min-h-12 w-full items-center justify-center rounded-sm border border-green bg-green px-4 py-3 text-sm font-semibold text-on-accent transition hover:bg-green-hover disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-muted disabled:text-gray-nav disabled:opacity-100';
const secondaryButtonClassName =
  'inline-flex min-h-12 w-full items-center justify-center rounded-sm border border-border px-4 py-3 text-sm font-semibold text-primary transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-gray-nav disabled:opacity-100';
const labelClassName = 'block text-xs font-semibold uppercase tracking-[0.08em] text-gray-nav';
const errorClassName = 'text-sm text-clay';

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
  const { unlockMethod, unlockWithPassphrase, unlockWithRecoveryKey } = useCrypto();
  const [passphrase, setPassphrase] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canUnlockWithPassphrase = passphrase.trim().length > 0;
  const canUnlockWithRecoveryKey = recoveryKey.trim().length > 0;
  const primarySecretLabel =
    unlockMethod === 'account_password' ? 'Account password' : 'Private-writing password';
  const primarySecretHelp =
    unlockMethod === 'account_password'
      ? 'Use the account password that was active when private writing was last connected.'
      : 'Use the private-writing password you created during setup.';

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
        <div className="space-y-2">
          <label className={labelClassName} htmlFor="private-unlock-passphrase">{primarySecretLabel}</label>
          <input
            id="private-unlock-passphrase"
            className={inputClassName}
            type="password"
            autoComplete="current-password"
            placeholder={primarySecretLabel}
            aria-describedby={error ? 'private-unlock-error' : undefined}
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
          />
          <p className="text-xs font-medium leading-5 text-gray-nav">{primarySecretHelp}</p>
        </div>
        <button className={buttonClassName} disabled={isSubmitting || !canUnlockWithPassphrase} onClick={() => submit('passphrase')}>
          Unlock with {primarySecretLabel.toLowerCase()}
        </button>
        <div className="border-t border-border pt-4">
          <label className={labelClassName} htmlFor="private-unlock-recovery">Recovery phrase</label>
          <input
            id="private-unlock-recovery"
            className={inputClassName}
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Recovery phrase"
            aria-describedby={error ? 'private-unlock-error' : undefined}
            value={recoveryKey}
            onChange={(event) => setRecoveryKey(event.target.value)}
          />
          <button className={`${secondaryButtonClassName} mt-3`} disabled={isSubmitting || !canUnlockWithRecoveryKey} onClick={() => submit('recovery')}>
            Unlock with recovery phrase
          </button>
        </div>
        {error && <p id="private-unlock-error" className={errorClassName} role="alert">{error}</p>}
      </div>
    </CryptoShell>
  );
};

const MigrationPanel: React.FC = () => {
  const { migrationProgress } = useCrypto();
  const label = migrationProgress?.label || 'private writing';
  const countText = typeof migrationProgress?.total === 'number'
    ? `${migrationProgress.processed} of ${migrationProgress.total}`
    : `${migrationProgress?.processed || 0}`;

  return (
    <CryptoShell
      title="Encrypting your existing writing"
      description="Your private data is being moved into zero-knowledge encrypted payloads on this device."
    >
      <div className="space-y-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-green motion-reduce:animate-none" aria-hidden="true" />
        </div>
        <p className="text-sm leading-6 text-gray-text">
          Working through {label}: {countText} rows checked.
        </p>
        <p className="text-sm leading-6 text-gray-text">
          Larger accounts can take a little longer. If this is interrupted, refresh and the migration can resume safely.
        </p>
      </div>
    </CryptoShell>
  );
};

export const PrivateDataGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, error } = useCrypto();
  const location = useLocation();

  if (status === 'loading') return <RouteLoadingFrame className="surface-scope-paper page-wash min-h-[100dvh] bg-body" />;
  if (status === 'migrating') return <MigrationPanel />;
  if (status === 'setupRequired') {
    if (location.pathname !== RoutePath.DASHBOARD) {
      return <Navigate to={RoutePath.DASHBOARD} replace state={{ from: location }} />;
    }
    return <>{children}</>;
  }
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

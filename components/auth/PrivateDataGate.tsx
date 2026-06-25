import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LockKey } from '@phosphor-icons/react/LockKey';
import { Check } from '@phosphor-icons/react/Check';
import { useCrypto } from '../../context/CryptoContext';
import { RouteLoadingFrame } from '../ui/RouteLoadingFrame';
import { RoutePath } from '../../types';

const panelClassName =
  'surface-scope-paper page-wash flex min-h-[100dvh] items-center justify-center bg-body px-4 py-10 text-primary';
const cardClassName =
  'w-full max-w-lg rounded-2xl border border-border bg-surface/95 p-6 shadow-card';
const inputClassName =
  'input-surface w-full rounded-xl px-3 py-3 text-sm text-primary outline-none focus:border-primary';
const buttonClassName =
  'inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-green bg-green px-4 py-3 text-sm font-semibold text-on-accent transition hover:bg-green-hover disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-muted disabled:text-gray-nav disabled:opacity-100';
const secondaryButtonClassName =
  'inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-semibold text-primary transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-gray-nav disabled:opacity-100';
const labelClassName = 'block text-xs font-semibold uppercase tracking-[0.08em] text-gray-nav';
const errorClassName = 'text-sm text-clay';

const CryptoShell: React.FC<{
  children: React.ReactNode;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  eyebrow?: string | null;
}> = ({ children, title, description, icon, eyebrow = 'Private writing' }) => (
  <div className={panelClassName}>
    <section className={cardClassName} aria-labelledby="private-data-title">
      {icon ? (
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green/10 text-green">
          {icon}
        </div>
      ) : null}
      {eyebrow ? <p className="label-caps mb-3 text-gray-nav">{eyebrow}</p> : null}
      <h1 id="private-data-title" className="text-2xl font-semibold text-primary">{title}</h1>
      {description ? <p className="mt-2 text-sm leading-6 text-gray-text">{description}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  </div>
);

const linkButtonClassName =
  'text-sm font-semibold text-green underline-offset-4 transition hover:underline disabled:opacity-60';

const UnlockPanel: React.FC = () => {
  const { unlockMethod, unlockWithPassphrase, unlockWithRecoveryKey } = useCrypto();
  const [passphrase, setPassphrase] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const canUnlockWithPassphrase = passphrase.trim().length > 0;
  const canUnlockWithRecoveryKey = recoveryKey.trim().length > 0;
  const primarySecretLabel =
    unlockMethod === 'account_password' ? 'Account password' : 'Private-writing password';

  const submit = async (mode: 'passphrase' | 'recovery') => {
    setIsSubmitting(true);
    setError('');
    try {
      if (mode === 'passphrase') {
        await unlockWithPassphrase(passphrase, remember);
      } else {
        await unlockWithRecoveryKey(recoveryKey, remember);
      }
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : 'Unable to unlock private writing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CryptoShell
      eyebrow={null}
      icon={<LockKey size={24} weight="duotone" />}
      title="Unlock your private writing"
      description="Your writing is encrypted on this device. Enter your password to unlock it."
    >
      <div className="space-y-5">
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
            onKeyDown={(event) => {
              if (event.key === 'Enter' && canUnlockWithPassphrase && !isSubmitting) submit('passphrase');
            }}
          />
        </div>

        <label className="flex cursor-pointer select-none items-center gap-3 text-sm font-medium text-primary">
          <span className="relative inline-flex h-5 w-5 shrink-0">
            <input
              type="checkbox"
              className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-border bg-surface text-transparent transition-colors peer-checked:border-green peer-checked:bg-green peer-checked:text-on-accent peer-focus-visible:ring-2 peer-focus-visible:ring-green/40">
              <Check size={13} weight="bold" />
            </span>
          </span>
          Keep me unlocked on this device
        </label>

        <button className={buttonClassName} disabled={isSubmitting || !canUnlockWithPassphrase} onClick={() => submit('passphrase')}>
          Unlock
        </button>

        {error && <p id="private-unlock-error" className={errorClassName} role="alert">{error}</p>}

        {showRecovery ? (
          <div className="space-y-2 border-t border-border pt-5">
            <label className={labelClassName} htmlFor="private-unlock-recovery">Recovery phrase</label>
            <input
              id="private-unlock-recovery"
              className={inputClassName}
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Paste your recovery phrase"
              aria-describedby={error ? 'private-unlock-error' : undefined}
              value={recoveryKey}
              onChange={(event) => setRecoveryKey(event.target.value)}
            />
            <button className={`${secondaryButtonClassName} mt-3`} disabled={isSubmitting || !canUnlockWithRecoveryKey} onClick={() => submit('recovery')}>
              Unlock with recovery phrase
            </button>
            <button type="button" className={`${linkButtonClassName} mt-1 block`} onClick={() => { setShowRecovery(false); setError(''); }}>
              Back to password
            </button>
          </div>
        ) : (
          <div className="border-t border-border pt-4 text-center">
            <button type="button" className={linkButtonClassName} onClick={() => { setShowRecovery(true); setError(''); }}>
              Forgot your password? Use your recovery phrase
            </button>
          </div>
        )}
      </div>
    </CryptoShell>
  );
};

const MigrationPanel: React.FC = () => {
  const { migrationProgress } = useCrypto();
  const label = migrationProgress?.label || 'private writing';
  const total = migrationProgress?.total;
  const processed = migrationProgress?.processed || 0;
  const hasKnownTotal = typeof total === 'number' && total > 0;
  const percent = hasKnownTotal ? Math.min(100, Math.round((processed / total) * 100)) : null;
  const countText = hasKnownTotal ? `${processed} of ${total}` : `${processed}`;

  return (
    <CryptoShell
      title="Encrypting your existing writing"
      description="Your private data is being moved into zero-knowledge encrypted payloads on this device."
    >
      <div className="space-y-4">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={hasKnownTotal ? total : undefined}
          aria-valuenow={hasKnownTotal ? processed : undefined}
        >
          {percent === null ? (
            <div className="h-full w-1/2 animate-pulse rounded-full bg-green motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <div
              className="h-full w-full origin-left rounded-full bg-green transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ transform: `scaleX(${percent / 100})` }}
              aria-hidden="true"
            />
          )}
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

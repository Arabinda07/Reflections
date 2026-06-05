import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import type { UnlockMethod } from '../../services/keyWrapperPolicy';
import { consumePendingAccountPassword } from '../../src/auth/accountPasswordHandoff';
import { supabase } from '../../src/supabaseClient';

const setupInputClassName =
  'input-surface w-full rounded-sm px-3 py-3 text-sm text-primary outline-none focus:border-primary';
const setupLabelClassName = 'block text-xs font-semibold uppercase tracking-[0.08em] text-gray-nav';

export const PrivateWritingSetupStep: React.FC<{
  canOfferAccountPassword: boolean;
  hasFreshAccountPassword: boolean;
  userId: string;
  email?: string;
  setupEncryption: (secret: string, unlockMethod?: UnlockMethod) => Promise<void>;
  confirmRecoveryKey: (recoveryKey: string) => Promise<void>;
  recoveryKey: string | null;
  onSetupComplete: () => Promise<void> | void;
}> = ({
  canOfferAccountPassword,
  hasFreshAccountPassword,
  userId,
  email,
  setupEncryption,
  confirmRecoveryKey,
  recoveryKey,
  onSetupComplete,
}) => {
  const [unlockMethod, setUnlockMethod] = useState<UnlockMethod>(
    canOfferAccountPassword ? 'account_password' : 'private_writing_password',
  );
  const [requiresAccountPassword, setRequiresAccountPassword] = useState(!hasFreshAccountPassword);
  const [accountPassword, setAccountPassword] = useState('');
  const [privatePassword, setPrivatePassword] = useState('');
  const [privatePasswordConfirmation, setPrivatePasswordConfirmation] = useState('');
  const [typedRecoveryKey, setTypedRecoveryKey] = useState('');
  const [hasSavedRecoveryKey, setHasSavedRecoveryKey] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPrivatePasswordReady =
    privatePassword.trim().length >= 12 && privatePassword === privatePasswordConfirmation;
  const isRecoveryConfirmed =
    Boolean(recoveryKey) && hasSavedRecoveryKey && typedRecoveryKey.trim() === recoveryKey;

  const createBundle = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      if (unlockMethod === 'account_password') {
        const pendingPassword = consumePendingAccountPassword(userId);
        const password = pendingPassword || accountPassword;
        if (!password) {
          setRequiresAccountPassword(true);
          throw new Error('Enter your account password to continue.');
        }

        if (!pendingPassword && email) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) throw new Error('That account password did not work.');
        }

        await setupEncryption(password, 'account_password');
      } else {
        if (!isPrivatePasswordReady) {
          throw new Error('Create and confirm a private-writing password with at least 12 characters.');
        }
        await setupEncryption(privatePassword, 'private_writing_password');
      }
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : 'Unable to set up private writing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmRecovery = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await confirmRecoveryKey(typedRecoveryKey);
      await onSetupComplete();
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Unable to confirm recovery phrase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (recoveryKey) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="label-caps text-green">Recovery phrase</p>
          <p className="text-base font-semibold leading-relaxed text-gray-text">
            Save this backup for private writing. Reflections cannot see it or restore it for you.
          </p>
        </div>
        <code className="block rounded-sm border border-border bg-surface-muted p-3 text-sm break-all">
          {recoveryKey}
        </code>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-gray-text">
          <input
            type="checkbox"
            checked={hasSavedRecoveryKey}
            onChange={(event) => setHasSavedRecoveryKey(event.target.checked)}
          />
          I saved this recovery phrase somewhere safe.
        </label>
        <div className="space-y-2">
          <label className={setupLabelClassName} htmlFor="onboarding-recovery-confirm">
            Confirm recovery phrase
          </label>
          <input
            id="onboarding-recovery-confirm"
            className={setupInputClassName}
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Paste the recovery phrase once"
            value={typedRecoveryKey}
            onChange={(event) => setTypedRecoveryKey(event.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-clay" role="alert">{error}</p> : null}
        <Button
          variant="primary"
          onClick={confirmRecovery}
          disabled={isSubmitting || !isRecoveryConfirmed}
          className="w-full min-h-12"
        >
          Confirm and continue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="label-caps text-green">Private writing</p>
        <p className="text-base font-semibold leading-relaxed text-gray-text">
          Choose how Reflections should unlock your private writing on this account.
        </p>
      </div>

      {canOfferAccountPassword ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setUnlockMethod('account_password')}
            className={`rounded-sm border p-4 text-left transition ${
              unlockMethod === 'account_password'
                ? 'border-green bg-green/5 text-primary'
                : 'border-border bg-surface text-gray-text hover:border-green/30'
            }`}
          >
            <span className="block text-sm font-bold">Use my account password</span>
            <span className="mt-1 inline-block text-[11px] font-black uppercase tracking-widest text-green">
              Recommended
            </span>
            <span className="mt-2 block text-xs leading-5">
              One less thing to remember. Recovery reconnects writing after a password reset.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setUnlockMethod('private_writing_password')}
            className={`rounded-sm border p-4 text-left transition ${
              unlockMethod === 'private_writing_password'
                ? 'border-green bg-green/5 text-primary'
                : 'border-border bg-surface text-gray-text hover:border-green/30'
            }`}
          >
            <span className="block text-sm font-bold">Use a separate password</span>
            <span className="mt-2 block text-xs leading-5">
              Keeps writing unlock separate from sign-in.
            </span>
          </button>
        </div>
      ) : (
        <p className="rounded-sm border border-border bg-surface-muted p-3 text-sm leading-6 text-gray-text">
          Google signs you in. A private-writing password unlocks your writing inside Reflections.
        </p>
      )}

      {unlockMethod === 'account_password' ? (
        !requiresAccountPassword ? (
          <p className="rounded-sm border border-green/20 bg-green/5 p-3 text-sm font-semibold text-gray-text">
            We can use the account password you just entered. It will not be stored.
          </p>
        ) : (
          <div className="space-y-2">
            <label className={setupLabelClassName} htmlFor="onboarding-account-password">
              Account password
            </label>
            <input
              id="onboarding-account-password"
              className={setupInputClassName}
              type="password"
              autoComplete="current-password"
              placeholder="Enter your account password"
              value={accountPassword}
              onChange={(event) => setAccountPassword(event.target.value)}
            />
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className={setupLabelClassName} htmlFor="onboarding-private-password">
              Private-writing password
            </label>
            <input
              id="onboarding-private-password"
              className={setupInputClassName}
              type="password"
              autoComplete="new-password"
              placeholder="At least 12 characters"
              value={privatePassword}
              onChange={(event) => setPrivatePassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className={setupLabelClassName} htmlFor="onboarding-private-password-confirm">
              Confirm private-writing password
            </label>
            <input
              id="onboarding-private-password-confirm"
              className={setupInputClassName}
              type="password"
              autoComplete="new-password"
              placeholder="Confirm private-writing password"
              value={privatePasswordConfirmation}
              onChange={(event) => setPrivatePasswordConfirmation(event.target.value)}
            />
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-clay" role="alert">{error}</p> : null}
      <Button
        variant="primary"
        onClick={createBundle}
        disabled={
          isSubmitting ||
          (unlockMethod === 'account_password' && requiresAccountPassword && !accountPassword) ||
          (unlockMethod === 'private_writing_password' && !isPrivatePasswordReady)
        }
        className="w-full min-h-12"
      >
        Create private-writing key
      </Button>
    </div>
  );
};

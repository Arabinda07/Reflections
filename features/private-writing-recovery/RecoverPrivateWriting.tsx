import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from '@phosphor-icons/react/CheckCircle';
import { Key } from '@phosphor-icons/react/Key';
import { Warning } from '@phosphor-icons/react/Warning';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { RouteLoadingFrame } from '../../components/ui/RouteLoadingFrame';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';
import { useCrypto } from '../../context/CryptoContext';
import { useAuthStore } from '../../hooks/useAuthStore';
import { supabase } from '../../src/supabaseClient';
import { RoutePath } from '../../types';
import {
  clearPendingResetAccountPassword,
  consumePendingResetAccountPassword,
  hasPendingResetAccountPassword,
} from './resetPasswordRecoveryHandoff';

type RecoveryMode = 'recovery_phrase' | 'previous_password';

export const RecoverPrivateWriting: React.FC = () => {
  const navigate = useNavigate();
  const crypto = useCrypto();
  const { user } = useAuthStore();
  const [mode, setMode] = useState<RecoveryMode>('recovery_phrase');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [previousPassword, setPreviousPassword] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    variant: 'info' | 'success' | 'warning' | 'error';
    title: string;
    description: string;
  } | null>(null);
  const [needsNewPassword, setNeedsNewPassword] = useState(() =>
    !user?.id || !hasPendingResetAccountPassword(user.id),
  );
  const canSubmit = useMemo(() => {
    const hasUnlockSecret = mode === 'recovery_phrase'
      ? recoveryPhrase.trim().length > 0
      : previousPassword.length > 0;
    return hasUnlockSecret && (!needsNewPassword || newAccountPassword.length >= 8);
  }, [mode, needsNewPassword, newAccountPassword, previousPassword, recoveryPhrase]);

  const verifyTypedNewPassword = async (password: string) => {
    if (!user?.email) return;
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (error) throw new Error('That new account password did not work.');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setFeedback(null);

    const pendingNewPassword = user?.id ? consumePendingResetAccountPassword(user.id) : null;
    const passwordForRewrap = pendingNewPassword || newAccountPassword;

    try {
      if (!passwordForRewrap) {
        setNeedsNewPassword(true);
        throw new Error('Enter your new account password to continue.');
      }
      if (!pendingNewPassword) await verifyTypedNewPassword(passwordForRewrap);

      if (mode === 'recovery_phrase') {
        await crypto.recoverAccountPasswordWithRecoveryKey(recoveryPhrase, passwordForRewrap);
      } else {
        await crypto.recoverAccountPasswordWithPreviousPassword(previousPassword, passwordForRewrap);
      }

      clearPendingResetAccountPassword();
      setFeedback({
        variant: 'success',
        title: 'Private writing recovered.',
        description: 'Your writing now unlocks with your new account password.',
      });
      window.setTimeout(() => {
        navigate(RoutePath.DASHBOARD, { replace: true });
      }, 700);
    } catch (error) {
      clearPendingResetAccountPassword();
      setFeedback({
        variant: 'error',
        title: 'Private writing could not be recovered.',
        description: error instanceof Error ? error.message : 'Check your recovery details and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (crypto.status === 'loading' || crypto.status === 'migrating') {
    return <RouteLoadingFrame className="surface-scope-paper page-wash min-h-[100dvh] bg-body" />;
  }

  return (
    <div className="surface-scope-paper page-wash flex flex-1 items-center justify-center bg-body p-6 transition-colors duration-300">
      <div className="w-full max-w-[520px]">
        <Surface variant="bezel">
          <div className="space-y-6 p-8 sm:p-10">
            <SectionHeader
              eyebrow="Private writing"
              title="Recover private writing"
              icon={
                <div className="icon-block icon-block-md">
                  <Key size={24} weight="duotone" />
                </div>
              }
            />

            <Alert
              variant="info"
              title="Your account password changed."
              description="Use your recovery phrase to reconnect private writing to the new account password."
              icon={<Warning size={20} weight="duotone" />}
            />

            {feedback ? (
              <Alert
                variant={feedback.variant}
                title={feedback.title}
                description={feedback.description}
                icon={
                  feedback.variant === 'success' ? (
                    <CheckCircle size={20} weight="fill" />
                  ) : (
                    <Warning size={20} weight="fill" />
                  )
                }
              />
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode('recovery_phrase')}
                  className={`rounded-sm border p-4 text-left transition ${
                    mode === 'recovery_phrase'
                      ? 'border-green bg-green/5 text-primary'
                      : 'border-border bg-surface text-gray-text hover:border-green/30'
                  }`}
                >
                  <span className="block text-sm font-bold">Recovery phrase</span>
                  <span className="mt-1 inline-block text-[11px] font-black uppercase tracking-widest text-green">
                    Recommended
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('previous_password')}
                  className={`rounded-sm border p-4 text-left transition ${
                    mode === 'previous_password'
                      ? 'border-green bg-green/5 text-primary'
                      : 'border-border bg-surface text-gray-text hover:border-green/30'
                  }`}
                >
                  <span className="block text-sm font-bold">I remember my previous password</span>
                  <span className="mt-2 block text-xs leading-5">
                    Use the account password that unlocked writing before reset.
                  </span>
                </button>
              </div>

              {mode === 'recovery_phrase' ? (
                <Input
                  id="private-writing-recovery-phrase"
                  type="text"
                  label="Recovery phrase"
                  autoComplete="off"
                  value={recoveryPhrase}
                  onChange={(event) => setRecoveryPhrase(event.target.value)}
                  placeholder="Paste your recovery phrase"
                />
              ) : (
                <Input
                  id="private-writing-previous-password"
                  type="password"
                  label="Previous account password"
                  autoComplete="current-password"
                  value={previousPassword}
                  onChange={(event) => setPreviousPassword(event.target.value)}
                  placeholder="Enter previous account password"
                />
              )}

              {needsNewPassword ? (
                <Input
                  id="private-writing-new-account-password"
                  type="password"
                  label="New account password"
                  autoComplete="current-password"
                  value={newAccountPassword}
                  onChange={(event) => setNewAccountPassword(event.target.value)}
                  placeholder="Enter your new account password"
                />
              ) : (
                <p className="rounded-sm border border-green/20 bg-green/5 p-3 text-sm font-semibold text-gray-text">
                  We can use the new account password you just created. It will not be stored.
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => navigate(RoutePath.ACCOUNT)}>
                  Later
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!canSubmit}>
                  Recover private writing
                </Button>
              </div>
            </form>
          </div>
        </Surface>
      </div>
    </div>
  );
};

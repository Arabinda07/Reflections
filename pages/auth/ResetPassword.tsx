import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from '@phosphor-icons/react/CheckCircle';
import { Warning } from '@phosphor-icons/react/Warning';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';
import { RoutePath } from '../../types';
import { supabase } from '../../src/supabaseClient';
import { storePendingResetAccountPassword } from '../../features/private-writing-recovery/resetPasswordRecoveryHandoff';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<{
    variant: 'info' | 'success' | 'warning' | 'error';
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setHasRecoverySession(Boolean(session));
    };

    checkSession();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!password || password.length < 8) {
      setFeedback({
        variant: 'error',
        title: 'Choose a stronger password.',
        description: 'Use at least 8 characters so your account stays protected.',
      });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({
        variant: 'error',
        title: 'Passwords do not match.',
        description: 'Please enter the same new password twice.',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const { data: encryptionRow, error: encryptionError } = await supabase
          .from('user_encryption_keys')
          .select('unlock_method')
          .eq('user_id', user.id)
          .maybeSingle();

        if (encryptionError) throw encryptionError;

        if (encryptionRow?.unlock_method === 'account_password') {
          storePendingResetAccountPassword(password, user.id);
          navigate(RoutePath.RECOVER_PRIVATE_WRITING, { replace: true });
          return;
        }
      }

      setFeedback({
        variant: 'success',
        title: 'Password updated.',
        description: 'You can sign back in with your new password now.',
      });

      window.setTimeout(() => {
        navigate(RoutePath.LOGIN, {
          replace: true,
          state: { successMessage: 'Your password has been updated. Please sign in again.' },
        });
      }, 900);
    } catch (error) {
      console.error(error);
      setFeedback({
        variant: 'error',
        title: 'Password update failed.',
        description: 'Open the email link again and retry from there.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface-scope-paper page-wash flex flex-1 items-center justify-center bg-body p-6 transition-colors duration-300">
      <div className="w-full max-w-[460px]">
        <Surface variant="bezel">
          <div className="p-8 sm:p-10 space-y-6">
            <SectionHeader
              eyebrow="Recovery"
              title="Create a new password"
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

            {hasRecoverySession === false ? (
              <Alert
                variant="info"
                title="Use the email link first."
                description="Open the recovery email we sent you, then return here to choose your new password."
                icon={<Warning size={20} weight="fill" />}
              />
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="password"
                type="password"
                label="New password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a new password"
                disabled={hasRecoverySession === false}
              />
              <Input
                id="confirm-password"
                type="password"
                label="Confirm password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your new password"
                disabled={hasRecoverySession === false}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => navigate(RoutePath.LOGIN)}>
                  Back to sign in
                </Button>
                <Button type="submit" variant="primary" isLoading={loading} disabled={hasRecoverySession === false}>
                  Save new password
                </Button>
              </div>
            </form>
          </div>
        </Surface>
      </div>
    </div>
  );
};

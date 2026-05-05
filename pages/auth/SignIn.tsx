import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Envelope, GoogleLogo, Lock } from '@phosphor-icons/react';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Surface } from '@/components/ui/Surface';
import { RoutePath } from '@/types';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { supabase } from '@/src/supabaseClient';
import {
  consumeGoogleAuthError,
  consumePendingGoogleAuthRedirectPath,
  resolvePostAuthRedirectPath,
  startGoogleOAuthFlow,
  signInWithVerifiedEmail,
  isGoogleOAuthCallbackUrl,
} from '@/src/auth/googleOAuth';
import {
  isVerifiedEmailAvailable,
  requestVerifiedEmail,
} from '@/src/auth/credentialManager';
import { trackGoogleAuthStartedDeferred } from '@/src/analytics/deferredEvents';
import { commitAuthSession } from '@/src/auth/sessionUser';

export const SignIn: React.FC = () => {
  useDocumentMeta({
    title: 'Reflections – A Calm Space to Write and Reflect',
    description: 'Sign in to your private journal to continue writing and reflecting.',
    path: RoutePath.LOGIN,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isInitialCheckDone } = useAuthStore();
  const [loading, setLoading] = useState(() => isGoogleOAuthCallbackUrl(window.location.href));
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const successMessage = location.state?.successMessage;
  const postLoginPath = resolvePostAuthRedirectPath(location.state?.from);

  useEffect(() => {
    const flashError = consumeGoogleAuthError(RoutePath.LOGIN);
    if (flashError) {
      setError(flashError);
    }
  }, []);

  useEffect(() => {
    if (!isInitialCheckDone || !isAuthenticated) {
      return;
    }

    navigate(consumePendingGoogleAuthRedirectPath(RoutePath.LOGIN) || postLoginPath, { replace: true });
  }, [isAuthenticated, isInitialCheckDone, navigate, postLoginPath]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResetMessage(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        if (data.session) {
          commitAuthSession(data.session);
        }
        navigate(postLoginPath, { replace: true, state: { justLoggedIn: true } });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const isNative = Capacitor.isNativePlatform();
    setError(null);
    setResetMessage(null);
    setLoading(true);
    trackGoogleAuthStartedDeferred({
      sourcePath: RoutePath.LOGIN,
      redirectPath: postLoginPath || RoutePath.DASHBOARD,
      isNative,
    });
    const launchError = await startGoogleOAuthFlow({
      sourcePath: RoutePath.LOGIN,
      redirectPath: postLoginPath || RoutePath.DASHBOARD,
    });

    if (launchError) {
      setError(launchError);
      setLoading(false);
    }
  };

  const handleVerifiedEmailLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const credential = await requestVerifiedEmail();
      if (!credential) {
        setLoading(false);
        return; // User cancelled or error already logged
      }

      const authResult = await signInWithVerifiedEmail(credential.assertion);
      const { success, error: authError } = authResult;

      if (!success) {
        setError(authError || 'Failed to sign in with verified email.');
        setLoading(false);
      } else {
        if (authResult.data?.session) {
          commitAuthSession(authResult.data.session);
        }
        navigate(postLoginPath, { replace: true, state: { justLoggedIn: true } });
      }
    } catch (err) {
      console.error('Verified Email error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email first so we know where to send the recovery link.');
      setResetMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResetMessage(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${RoutePath.RESET_PASSWORD}`,
      });

      if (resetError) throw resetError;

      setResetMessage('Password reset email sent. Check your inbox for the secure recovery link.');
    } catch (err) {
      console.error('Password reset error:', err);
      setError('We could not send the reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface-scope-paper page-wash flex flex-1 items-center justify-center bg-body p-6 transition-colors duration-300">
      <div className="w-full max-w-[460px]">
        <Surface variant="bezel">
          <div className="p-8 sm:p-10 space-y-6">
            <Link
              to={RoutePath.HOME}
              className="-ml-3 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] px-3 text-[13px] font-bold text-gray-nav transition-colors hover:bg-green/5 hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
              aria-label="Back to home"
            >
              <ArrowLeft size={16} weight="bold" />
              Back
            </Link>

            <SectionHeader
              eyebrow="Welcome back"
              title="Sign in"
              icon={
                <div className="icon-block icon-block-md">
                  <Lock size={24} weight="duotone" />
                </div>
              }
            />

            {successMessage ? (
              <Alert
                variant="success"
                icon={<CheckCircle size={20} weight="fill" />}
                title="You’re all set."
                description={successMessage}
              />
            ) : null}

            {resetMessage ? (
              <Alert
                variant="info"
                icon={<CheckCircle size={20} weight="fill" />}
                title="Recovery email sent."
                description={resetMessage}
              />
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div 
                animate={error ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}} 
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  icon={Envelope}
                />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  icon={Lock}
                />
              </motion.div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-3 text-[13px] font-bold text-green hover:opacity-70"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" variant="primary" className="w-full h-[52px] text-[15px] font-bold" isLoading={loading}>
                Sign in
              </Button>

              <div className="min-h-[24px] mt-2 flex items-center justify-center">
                <AnimatePresence>
                  {error ? (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-[13px] font-bold text-clay text-center"
                    >
                      {error}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
            </form>

            <div className="my-2 flex w-full items-center gap-4">
              <div className="h-[1px] flex-1 bg-border" />
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Or</span>
              <div className="h-[1px] flex-1 bg-border" />
            </div>

            <div className="space-y-3">
              {isVerifiedEmailAvailable() && (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleVerifiedEmailLogin}
                  disabled={loading}
                  className="w-full h-[52px] gap-3"
                >
                  <CheckCircle size={20} weight="fill" className="text-green" />
                  <span className="font-bold text-gray-text">Continue with Verified Email</span>
                </Button>
              )}

              <Button
                variant="secondary"
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-[52px] gap-3"
              >
              <GoogleLogo size={20} weight="bold" aria-hidden="true" className="text-gray-text" />
              <span className="font-bold text-gray-text">Continue with Google</span>
            </Button>
          </div>

            <p className="text-[15px] font-bold text-gray-light text-center">
              Don&apos;t have an account?{' '}
              <Link
                to={RoutePath.SIGNUP}
                className="inline-flex min-h-11 items-center rounded-xl px-2 text-green transition-colors hover:text-green/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
              >
                Sign up
              </Link>
            </p>
          </div>
        </Surface>
      </div>
    </div>
  );
};

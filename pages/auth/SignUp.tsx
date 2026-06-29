import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { Check } from '@phosphor-icons/react/Check';
import { CheckCircle } from '@phosphor-icons/react/CheckCircle';
import { Envelope } from '@phosphor-icons/react/Envelope';
import { GoogleLogo } from '@phosphor-icons/react/GoogleLogo';
import { Lock } from '@phosphor-icons/react/Lock';
import { User } from '@phosphor-icons/react/User';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Surface } from '@/components/ui/Surface';
import { RoutePath } from '@/types';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { PUBLIC_SEO_DEFAULT } from '@/src/config/publicSeoCopy.js';
import { supabase } from '@/src/supabaseClient';
import { getPublicHomePath } from '@/src/utils/authHints';
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
import { NEWSLETTER_SIGNUP_LABEL, buildNewsletterOptInMetadata } from '@/src/newsletter';
import { referralService } from '@/services/referralService';
import { commitAuthSession } from '@/src/auth/sessionUser';
import { storePendingAccountPassword } from '@/src/auth/accountPasswordHandoff';
import { getSignupEmailRedirectTo } from '@/src/auth/authRedirectConfig';

export const SignUp: React.FC = () => {
  useDocumentMeta({
    title: PUBLIC_SEO_DEFAULT.title,
    description: 'Create an account to start your private journal and reflection practice.',
    path: RoutePath.SIGNUP,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isInitialCheckDone } = useAuthStore();
  const [loading, setLoading] = useState(() => isGoogleOAuthCallbackUrl(window.location.href));
  const [error, setError] = useState<string | null>(location.state?.errorMessage || null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const postLoginPath = resolvePostAuthRedirectPath(location.state?.from);
  const homePath = getPublicHomePath();
  const referralRecordedRef = useRef(false);

  const recordAcceptedReferral = useCallback(async () => {
    if (referralRecordedRef.current) return;

    referralRecordedRef.current = true;
    try {
      await referralService.recordAcceptedReferral();
    } catch (referralError) {
      referralRecordedRef.current = false;
      console.error('Could not record accepted referral:', referralError);
    }
  }, []);

  useEffect(() => {
    const flashError = consumeGoogleAuthError(RoutePath.SIGNUP);
    if (flashError) {
      setError(flashError);
    }
  }, []);

  useEffect(() => {
    if (!isInitialCheckDone || !isAuthenticated) {
      return;
    }

    const completeRedirect = async () => {
      await recordAcceptedReferral();
      navigate(consumePendingGoogleAuthRedirectPath(RoutePath.SIGNUP) || postLoginPath, { replace: true });
    };

    void completeRedirect();
  }, [isAuthenticated, isInitialCheckDone, navigate, postLoginPath, recordAcceptedReferral]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Supabase hosted auth must allow-list this exact production callback URL
          // in Authentication -> URL Configuration, or signup confirmation links will fail.
          emailRedirectTo: getSignupEmailRedirectTo(),
          data: {
            full_name: name.trim() || email.split('@')[0],
            ...buildNewsletterOptInMetadata(newsletterOptIn),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user && !data.session) {
        navigate(RoutePath.LOGIN, {
          state: {
            successMessage: `We sent a verification link to ${email}. Open it, then sign in here to start writing.`,
            email,
          },
        });
      } else if (data.session) {
        commitAuthSession(data.session);
        storePendingAccountPassword(password, data.session.user.id);
        await recordAcceptedReferral();
        navigate(postLoginPath, { replace: true, state: { justLoggedIn: true } });
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    const launchError = await startGoogleOAuthFlow({
      sourcePath: RoutePath.SIGNUP,
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
        return;
      }

      const authResult = await signInWithVerifiedEmail(credential.assertion);
      const { success, error: authError } = authResult;

      if (!success) {
        setError(authError || 'Failed to sign up with verified email.');
        setLoading(false);
      } else {
        if (authResult.data?.session) {
          commitAuthSession(authResult.data.session);
        }
        await recordAcceptedReferral();
        navigate(postLoginPath, { replace: true, state: { justLoggedIn: true } });
      }
    } catch (err) {
      console.error('Verified Email error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="surface-scope-paper page-wash flex flex-1 items-center justify-center bg-body p-6 transition-colors duration-300">
      <div className="w-full max-w-[460px]">
        <Surface variant="bezel">
          <div className="p-8 sm:p-10 space-y-6">
            <Link
              to={homePath}
              className="-ml-3 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] px-3 text-btn-sm font-bold text-gray-nav transition-colors hover:bg-green/5 hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
              aria-label="Back to home"
            >
              <ArrowLeft size={16} weight="bold" />
              Back
            </Link>

            <SectionHeader
              eyebrow="Join Reflections"
              title="Create account"
            />

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

            <div className="my-2 flex w-full items-center gap-4">
              <div className="h-[1px] flex-1 bg-border" />
              <span className="text-ui-xs font-black uppercase tracking-widest text-gray-nav">Or sign up with email</span>
              <div className="h-[1px] flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div 
                animate={error ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}} 
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                <Input
                  id="name"
                  name="name"
                  type="text"
                  label="Full name (optional)"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  icon={User}
                />
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
                <div className="space-y-1.5">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    label="Password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    aria-describedby="signup-password-hint"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password"
                    icon={Lock}
                  />
                  <p id="signup-password-hint" className="ml-1 text-ui-xs font-semibold text-gray-nav">
                    At least 8 characters.
                  </p>
                </div>
              </motion.div>

              <label htmlFor="newsletter" className="mt-4 flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-[var(--radius-control)] pr-2 text-ui-sm font-medium text-gray-text">
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    id="newsletter"
                    checked={newsletterOptIn}
                    onChange={(e) => setNewsletterOptIn(e.target.checked)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${
                      newsletterOptIn ? 'border-green bg-green text-white' : 'border-border bg-body text-transparent'
                    }`}
                  >
                    <Check size={16} weight="bold" />
                  </span>
                </span>
                <span>
                  {NEWSLETTER_SIGNUP_LABEL}
                </span>
              </label>

              <Button type="submit" variant="primary" className="w-full h-[52px] text-ui-base font-bold mt-6" isLoading={loading}>
                Create account
              </Button>

              <div className="min-h-[24px] mt-2 flex items-center justify-center" role="alert" aria-live="assertive">
                <AnimatePresence>
                  {error ? (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-btn-sm font-bold text-clay text-center"
                    >
                      {error}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
            </form>

            <p className="text-ui-base font-bold text-gray-light text-center">
              Already have an account?{' '}
              <Link
                to={RoutePath.LOGIN}
                className="inline-flex min-h-11 items-center rounded-xl px-2 text-green transition-colors hover:text-green/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Surface>
      </div>
    </div>
  );
};

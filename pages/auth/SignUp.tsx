import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Envelope, Lock, User, UserPlus } from '@phosphor-icons/react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';
import { RoutePath } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../src/supabaseClient';
import {
  trackGoogleAuthFailed,
  trackGoogleAuthStarted,
} from '../../src/analytics/events';
import {
  consumeGoogleAuthError,
  consumePendingGoogleAuthRedirectPath,
  resolvePostAuthRedirectPath,
  startGoogleOAuthFlow,
} from '../../src/auth/googleOAuth';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isInitialCheckDone } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const postLoginPath = resolvePostAuthRedirectPath(location.state?.from);

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

    navigate(consumePendingGoogleAuthRedirectPath(RoutePath.SIGNUP) || postLoginPath, { replace: true });
  }, [isAuthenticated, isInitialCheckDone, navigate, postLoginPath]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user && !data.session) {
        navigate(RoutePath.LOGIN, {
          state: {
            successMessage: 'Account created successfully! Please check your email and verify your address before logging in.',
            email,
          },
        });
      } else if (data.session) {
        navigate(postLoginPath, { replace: true });
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const isNative = Capacitor.isNativePlatform();
    setError(null);
    setLoading(true);
    trackGoogleAuthStarted({
      sourcePath: RoutePath.SIGNUP,
      redirectPath: postLoginPath,
      isNative,
    });
    const launchError = await startGoogleOAuthFlow({
      sourcePath: RoutePath.SIGNUP,
      redirectPath: postLoginPath,
    });

    if (launchError) {
      trackGoogleAuthFailed({
        sourcePath: RoutePath.SIGNUP,
        isNative,
        errorCode: launchError,
      });
      setError(launchError);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-body p-6 transition-colors duration-300">
      <div className="w-full max-w-[460px]">
        <Surface variant="bezel">
          <div className="p-8 sm:p-10 space-y-6">
            <SectionHeader
              eyebrow="Start gently"
              title="Create account"
              description="Create your private writing space. Optional AI stays optional until you ask for it."
              icon={
                <div className="icon-block icon-block-md">
                  <UserPlus size={24} weight="duotone" />
                </div>
              }
            />

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="name"
                name="name"
                type="text"
                label="Full name"
                required
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
              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                icon={Lock}
              />

              <Button type="submit" variant="primary" className="w-full h-[52px] text-[15px] font-bold mt-4" isLoading={loading}>
                Create account
              </Button>

              <div className="min-h-[24px] mt-2 flex items-center justify-center">
                <AnimatePresence>
                  {error ? (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-[13px] font-bold text-red text-center"
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

            <Button
              variant="secondary"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-[52px] gap-3"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                className="h-5 w-5"
                alt="Google"
              />
              <span className="font-bold text-gray-text">Continue with Google</span>
            </Button>

            <p className="text-[15px] font-bold text-gray-light text-center">
              Already have an account?{' '}
              <Link to={RoutePath.LOGIN} className="text-green hover:opacity-70">
                Sign in
              </Link>
            </p>
          </div>
        </Surface>
      </div>
    </div>
  );
};

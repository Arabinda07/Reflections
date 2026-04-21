import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Envelope, Lock, User, UserPlus } from '@phosphor-icons/react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../src/supabaseClient';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user && !data.session) {
        // Email confirmation is likely enabled
        navigate(RoutePath.LOGIN, { 
          state: { 
            successMessage: 'Account created successfully! Please check your email and verify your address before logging in.',
            email: email
          } 
        });
      } else if (data.session) {
        // Auto-login happened (email confirmation disabled)
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
    setError(null);
    setLoading(true);
    const launchError = await startGoogleOAuthFlow({
      sourcePath: RoutePath.SIGNUP,
      redirectPath: postLoginPath,
    });

    if (launchError) {
      setError(launchError);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-body p-6 transition-colors duration-300">
      <div className="w-full max-w-[420px] bezel-outer">
        <div className="bezel-inner flex flex-col items-center p-8 sm:p-10">
          <div className="mb-6 h-[80px] w-[80px] flex items-center justify-center rounded-2xl bg-green/10 text-green shadow-sm border border-border">
             <UserPlus size={40} weight="duotone" />
          </div>

          <h1 className="font-display text-[32px] text-gray-text mb-2">
            Create account
          </h1>
          <p className="text-[15px] font-medium text-gray-light text-center mb-8">
            Start your journey to a clearer mind.
          </p>
        
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <Input 
              id="name"
              name="name"
              type="text" 
              label="Full Name"
              required
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
              placeholder="Create a password" 
              icon={Lock}
            />

            <Button 
              type="submit" 
              variant="primary"
              className="w-full h-[52px] text-[15px] font-bold mt-4" 
              isLoading={loading}
            >
              Create account
            </Button>

            <div className="min-h-[24px] mt-2 flex items-center justify-center">
              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-[13px] font-bold text-red text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </form>

          <div className="my-8 flex w-full items-center gap-4">
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
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
            <span className="font-bold text-gray-text">Continue with Google</span>
          </Button>

          <p className="mt-8 text-[15px] font-bold text-gray-light">
            Already have an account? <Link to={RoutePath.LOGIN} className="text-blue hover:opacity-70">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

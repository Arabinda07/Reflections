import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Envelope, Lock, CheckCircle } from '@phosphor-icons/react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';
import { supabase } from '../../src/supabaseClient';

export const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const successMessage = location.state?.successMessage;
  const prefilledEmail = location.state?.email || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        navigate(RoutePath.HOME);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError("An unexpected error occurred during Google login.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-body p-6 transition-colors duration-300">
      <div className="w-full max-w-[420px] bezel-outer">
        <div className="bezel-inner flex flex-col items-center p-8 sm:p-10">
          <div className="mb-6 h-[80px] w-[80px] flex items-center justify-center rounded-2xl bg-blue/10 text-blue shadow-sm border border-border">
             <Lock size={40} weight="duotone" />
          </div>

          <h1 className="font-display text-[32px] text-gray-text mb-2">
            Sign in
          </h1>
          <p className="text-[15px] font-medium text-gray-light text-center mb-8">
            Welcome back to your safe space.
          </p>

          {successMessage && (
             <div className="w-full mb-6 flex items-start gap-3 rounded-xl bg-green/10 p-4 text-[13px] text-green border border-green/20">
                <CheckCircle size={20} weight="fill" className="shrink-0" />
                <span className="font-bold">{successMessage}</span>
             </div>
          )}
        
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <Input 
              id="email"
              name="email"
              type="email" 
              label="Email"
              autoComplete="email" 
              required
              defaultValue={prefilledEmail}
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
              placeholder="Enter your password" 
              icon={Lock}
            />
            
            <div className="flex justify-end">
              <a href="#" className="text-[13px] font-bold text-blue hover:opacity-70">Forgot password?</a>
            </div>

            <Button 
              type="submit" 
              variant="primary"
              className="w-full h-[52px] text-[15px] font-bold" 
              isLoading={loading}
            >
              Sign in
            </Button>

            {error && (
              <p className="text-[13px] font-bold text-red text-center mt-2 animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}
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
            Don't have an account? <Link to={RoutePath.SIGNUP} className="text-blue hover:opacity-70">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
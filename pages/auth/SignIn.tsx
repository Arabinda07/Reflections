import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, CheckCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';
import { supabase } from '../../supabaseClient';

export const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.successMessage;
  const prefilledEmail = location.state?.email || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        alert(error.message);
      } else {
        navigate(RoutePath.HOME);
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('An unexpected error occurred');
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
        alert(error.message);
        setLoading(false);
      }
    } catch (err) {
      console.error("Google login error:", err);
      alert("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] p-6">
      <div className="w-full max-w-[420px] bg-white border-2 border-border rounded-[32px] p-8 sm:p-10 shadow-[0_8px_0_0_#E5E5E5] liquid-glass">
        <div className="flex flex-col items-center">
          <div className="mb-6 h-[80px] w-[80px] flex items-center justify-center rounded-2xl bg-blue text-white shadow-3d-blue">
             <Lock size={40} strokeWidth={2.5} />
          </div>

          <h1 className="font-display text-[32px] text-gray-text lowercase mb-2">
            sign in
          </h1>
          <p className="text-[15px] font-bold text-gray-light text-center mb-8">
            Welcome back to your safe space.
          </p>

          {successMessage && (
             <div className="w-full mb-6 flex items-start gap-3 rounded-xl bg-green/10 p-4 text-[13px] text-green border border-green/20">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
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
              icon={Mail}
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
              className="w-full h-[52px] text-[15px] font-bold uppercase" 
              isLoading={loading}
            >
              SIGN IN
            </Button>
          </form>

          <div className="my-8 flex w-full items-center gap-4">
            <div className="h-[2px] flex-1 bg-border" />
            <span className="text-[13px] font-bold text-gray-nav uppercase">OR</span>
            <div className="h-[2px] flex-1 bg-border" />
          </div>

          <Button 
            variant="secondary" 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-[52px] gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
            <span className="text-blue font-bold uppercase">CONTINUE WITH GOOGLE</span>
          </Button>

          <p className="mt-8 text-[15px] font-bold text-gray-light">
            Don't have an account? <Link to={RoutePath.SIGNUP} className="text-blue hover:opacity-70 uppercase">SIGN UP</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../src/supabaseClient';
import { RoutePath } from '../../types';
import { RouteLoadingFrame } from '../../components/ui/RouteLoadingFrame';
import {
  consumePendingGoogleAuthRedirectPath,
  getPendingGoogleAuthPath,
  stashGoogleAuthError,
} from '../../src/auth/googleOAuth';

/**
 * Handles the Supabase OAuth PKCE callback.
 * Exchanges the 'code' for a session and redirects to the intended path.
 */
export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      const sourcePath = getPendingGoogleAuthPath() || RoutePath.LOGIN;

      if (error || errorDescription) {
        const message = errorDescription || error || 'Google authentication failed.';
        stashGoogleAuthError(message);
        navigate(sourcePath, { replace: true });
        return;
      }

      if (!code) {
        // If we landed here without a code and no error, something is wrong.
        // Try to see if we already have a session (sometimes Supabase handles it).
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const redirectPath = consumePendingGoogleAuthRedirectPath(sourcePath) || RoutePath.DASHBOARD;
          navigate(redirectPath, { replace: true });
        } else {
          navigate(RoutePath.LOGIN, { replace: true });
        }
        return;
      }

      try {
        // Exchange the code for a session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;

        // Double check we have a session now
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
          throw new Error('Session could not be established after code exchange.');
        }

        // Success! Consume the redirect path and go home/dashboard
        const redirectPath = consumePendingGoogleAuthRedirectPath(sourcePath) || RoutePath.DASHBOARD;
        navigate(redirectPath, { replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        stashGoogleAuthError(err instanceof Error ? err.message : 'Failed to establish session.');
        navigate(sourcePath, { replace: true });
      }
    };

    void handleCallback();
  }, [navigate]);

  return <RouteLoadingFrame />;
};

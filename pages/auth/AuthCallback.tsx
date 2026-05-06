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
import { commitAuthSession } from '../../src/auth/sessionUser';

/**
 * Handles the Supabase OAuth PKCE callback for web.
 *
 * Architecture: `detectSessionInUrl` is disabled in supabaseClient.js,
 * so this component is the SOLE consumer of the PKCE code verifier on web.
 * The native flow uses consumeNativeGoogleOAuthCallback() instead.
 * Having exactly one consumer eliminates PKCE double-consumption races.
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
      const nextPath = params.get('next');

      const sourcePath = getPendingGoogleAuthPath() || RoutePath.LOGIN;

      if (error || errorDescription) {
        const message = errorDescription || error || 'Google authentication failed.';
        stashGoogleAuthError(message);
        navigate(sourcePath, { replace: true });
        return;
      }

      if (!code) {
        // No code and no error — check if we already have a session somehow
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          commitAuthSession(session);
          const redirectPath = nextPath || consumePendingGoogleAuthRedirectPath(sourcePath) || RoutePath.DASHBOARD;
          navigate(redirectPath, { replace: true });
        } else {
          stashGoogleAuthError('No authorization code received. Please try signing in again.');
          navigate(sourcePath, { replace: true });
        }
        return;
      }

      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) {
          throw new Error('Session could not be established after code exchange.');
        }

        commitAuthSession(session);

        const redirectPath = nextPath || consumePendingGoogleAuthRedirectPath(sourcePath) || RoutePath.DASHBOARD;
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

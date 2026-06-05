import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../src/supabaseClient';
import { RoutePath } from '../../types';
import { RouteLoadingFrame } from '../../components/ui/RouteLoadingFrame';
import {
  consumePendingGoogleAuthRedirectPath,
  getPendingGoogleAuthPath,
} from '../../src/auth/googleOAuth';
import { resolveSafeCallbackNextPath } from '../../src/auth/authRedirectConfig';
import { commitAuthSession } from '../../src/auth/sessionUser';

type AuthCallbackFeedback = {
  successMessage?: string;
  errorMessage?: string;
};

const SIGNUP_CONFIRMATION_SUCCESS = 'Your email has been confirmed. Welcome to Reflections.';
const LOGIN_CONFIRMATION_SUCCESS = 'Your email has been confirmed. Please sign in to continue.';

const navigateWithFeedback = (
  navigate: ReturnType<typeof useNavigate>,
  path: string,
  feedback: AuthCallbackFeedback,
) => {
  navigate(path, { replace: true, state: feedback });
};

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

      const pendingSourcePath = getPendingGoogleAuthPath();
      const sourcePath = pendingSourcePath || RoutePath.LOGIN;
      const safeNextPath = resolveSafeCallbackNextPath(nextPath);

      if (error || errorDescription) {
        const message = errorDescription || error || 'Authentication failed.';
        navigateWithFeedback(navigate, sourcePath, { errorMessage: message });
        return;
      }

      if (!code) {
        // No code and no error — check if we already have a session somehow.
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          commitAuthSession(session);
          const redirectPath = safeNextPath || consumePendingGoogleAuthRedirectPath(sourcePath) || RoutePath.DASHBOARD;
          navigate(redirectPath, { replace: true });
        } else {
          navigateWithFeedback(navigate, sourcePath, {
            errorMessage: 'This sign-in link is missing an authorization code. Please request a new link and try again.',
          });
        }
        return;
      }

      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session) {
          commitAuthSession(session);
        }

        if (safeNextPath) {
          navigate(safeNextPath, { replace: true });
          return;
        }

        if (pendingSourcePath) {
          const redirectPath = consumePendingGoogleAuthRedirectPath(pendingSourcePath) || RoutePath.DASHBOARD;
          navigate(redirectPath, { replace: true });
          return;
        }

        if (session) {
          navigate(RoutePath.DASHBOARD, {
            replace: true,
            state: { successMessage: SIGNUP_CONFIRMATION_SUCCESS, justLoggedIn: true },
          });
        } else {
          navigateWithFeedback(navigate, RoutePath.LOGIN, {
            successMessage: LOGIN_CONFIRMATION_SUCCESS,
          });
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        navigateWithFeedback(navigate, sourcePath, {
          errorMessage: err instanceof Error ? err.message : 'We could not verify this auth link. Please request a new link and try again.',
        });
      }
    };

    void handleCallback();
  }, [navigate]);

  return <RouteLoadingFrame />;
};

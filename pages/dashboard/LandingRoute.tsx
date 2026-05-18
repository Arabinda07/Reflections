import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { RouteLoadingFrame } from '../../components/ui/RouteLoadingFrame';
import {
  clearLandingAuthHintPendingClass,
  hasStrongStoredAuthSessionHint,
  resolveAuthHintLandingPath,
  syncStoredAuthSessionHintStatus,
} from '../../src/utils/authHints';
import { RoutePath } from '../../types';
import { Landing } from './Landing';

const LANDING_SESSION_CHECK_TIMEOUT_MS = 2800;
const LANDING_TIMEOUT_RESULT = { path: RoutePath.HOME, verified: false } as const;

export const LandingRoute: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCheckingSession, setIsCheckingSession] = useState(() =>
    hasStrongStoredAuthSessionHint(),
  );

  useEffect(() => {
    if (!isCheckingSession) {
      return;
    }

    let isActive = true;
    let fallbackTimer = 0;

    const checkExistingSession = async () => {
      const nextPath = await Promise.race([
        resolveAuthHintLandingPath(async () => {
          const { supabase } = await import('../../src/supabaseClient');
          const {
            data: { session },
          } = await supabase.auth.getSession();

          return session;
        }),
        new Promise<typeof LANDING_TIMEOUT_RESULT>((resolve) => {
          fallbackTimer = window.setTimeout(() => resolve(LANDING_TIMEOUT_RESULT), LANDING_SESSION_CHECK_TIMEOUT_MS);
        }),
      ]);

      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }

      if (!isActive) {
        return;
      }

      if (nextPath.path === RoutePath.DASHBOARD) {
        syncStoredAuthSessionHintStatus({ id: 'session' });
        clearLandingAuthHintPendingClass();
        navigate(RoutePath.DASHBOARD, { replace: true, state: location.state });
        return;
      }

      if (nextPath.verified) {
        syncStoredAuthSessionHintStatus(null);
      }

      clearLandingAuthHintPendingClass();
      setIsCheckingSession(false);
    };

    void checkExistingSession();

    return () => {
      isActive = false;

      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
    };
  }, [isCheckingSession, location.state, navigate]);

  if (isCheckingSession) {
    return <RouteLoadingFrame className="surface-scope-sage page-wash min-h-[100dvh]" />;
  }

  return <Landing />;
};

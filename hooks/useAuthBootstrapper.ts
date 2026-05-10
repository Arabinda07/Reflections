import { useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useAuthStore } from './useAuthStore';
import {
  identifyAnalyticsUserDeferred,
  resetAnalyticsUserDeferred,
} from '../src/analytics/deferredEvents';
import { getAuthAdapter } from '../src/auth/AuthRuntime';
import { mapSessionToUser } from '../src/auth/sessionUser';

export const useAuthBootstrapper = () => {
  const { setHydrated, setUser, setInitialCheckDone } = useAuthStore();
  const lastAnalyticsUserIdRef = useRef<string | null>(null);

  const syncAnalyticsSession = (session: Session | null) => {
    if (session) {
      if (lastAnalyticsUserIdRef.current !== session.user.id) {
        identifyAnalyticsUserDeferred({ id: session.user.id });
        lastAnalyticsUserIdRef.current = session.user.id;
      }
      return;
    }

    if (lastAnalyticsUserIdRef.current) {
      resetAnalyticsUserDeferred();
      lastAnalyticsUserIdRef.current = null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const markAuthCheckComplete = () => {
      if (!mounted) return;
      setHydrated(true);
      setInitialCheckDone(true);
    };

    const checkSession = async () => {
      try {
        const session = await getAuthAdapter().getSession();
        
        if (mounted) {
          if (session) {
            setUser(mapSessionToUser(session));
            syncAnalyticsSession(session);
          } else {
            setUser(null);
            syncAnalyticsSession(null);
          }
          markAuthCheckComplete();
        }
      } catch (err) {
        console.error('Fatal auth check error:', err);
        markAuthCheckComplete();
      }
    };

    void checkSession();

    authSubscription = {
      unsubscribe: getAuthAdapter().onAuthChange((session) => {
        if (!mounted) return;
        if (session) {
          setUser(mapSessionToUser(session));
          syncAnalyticsSession(session);
        } else {
          setUser(null);
          syncAnalyticsSession(null);
        }
        setInitialCheckDone(true);
      }),
    };

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [setUser, setHydrated, setInitialCheckDone]);
};

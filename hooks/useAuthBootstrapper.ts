import { useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useAuthStore } from './useAuthStore';
import {
  identifyAnalyticsUserDeferred,
  resetAnalyticsUserDeferred,
} from '../src/analytics/deferredEvents';
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
        const { supabase } = await import('../src/supabaseClient');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session) {
            setUser(mapSessionToUser(session));
            syncAnalyticsSession(session);
          } else if (error) {
            console.warn('Supabase session check failed:', error);
            if (error.status && error.status >= 400 && error.status < 500) {
              // 4xx errors mean the session is invalid or expired
              setUser(null);
              syncAnalyticsSession(null);
            } else {
              console.warn('Likely offline. Using local persisted session.');
              // Session remains as it was in the persisted Zustand store
            }
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
    
    void import('../src/supabaseClient').then(({ supabase }) => {
      if (!mounted) return;

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        if (session) {
          setUser(mapSessionToUser(session));
          syncAnalyticsSession(session);
        } else {
          setUser(null);
          syncAnalyticsSession(null);
        }
        setInitialCheckDone(true);
      });

      if (!mounted) {
        subscription.unsubscribe();
        return;
      }

      authSubscription = subscription;
    });

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [setUser, setHydrated, setInitialCheckDone]);
};

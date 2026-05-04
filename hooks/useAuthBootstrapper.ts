import { useEffect, useRef } from 'react';
import { supabase } from '../src/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { useAuthStore } from './useAuthStore';
import { User } from '../types';
import {
  identifyAnalyticsUserDeferred,
  resetAnalyticsUserDeferred,
} from '../src/analytics/deferredEvents';

const getSessionAvatarUrl = (session: Session) =>
  session.user.user_metadata?.avatar_url ||
  session.user.user_metadata?.picture ||
  session.user.user_metadata?.avatar ||
  null;

const mapSessionToUser = (session: Session): User => ({
  id: session.user.id,
  email: session.user.email || '',
  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
  avatarUrl: getSessionAvatarUrl(session) || undefined,
});

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

    const checkSession = async () => {
      try {
        // First check Supabase (if online)
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
          setHydrated(true);
          setInitialCheckDone(true);
        }
      } catch (err) {
        console.error('Fatal auth check error:', err);
        if (mounted) {
          setHydrated(true);
          setInitialCheckDone(true);
        }
      }
    };

    checkSession();

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

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setHydrated, setInitialCheckDone]);
};

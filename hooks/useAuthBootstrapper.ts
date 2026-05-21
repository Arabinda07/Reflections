import { useEffect } from 'react';
import { useAuthStore } from './useAuthStore';
import { getAuthAdapter } from '../src/auth/AuthRuntime';
import { mapSessionToUser } from '../src/auth/sessionUser';

export const useAuthBootstrapper = () => {
  const { setHydrated, setUser, setInitialCheckDone } = useAuthStore();

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
          } else {
            setUser(null);
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
        } else {
          setUser(null);
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

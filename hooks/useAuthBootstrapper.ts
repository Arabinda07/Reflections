import { useEffect, useRef } from 'react';
import { useAuthStore } from './useAuthStore';
import { getAuthAdapter } from '../src/auth/AuthRuntime';
import { mapSessionToUser } from '../src/auth/sessionUser';
import { clearAllVolatileAuthSecrets } from '../src/auth/volatileSecretHandoff';

export const useAuthBootstrapper = () => {
  const { setHydrated, setUser, setInitialCheckDone, user } = useAuthStore();
  const previousUserIdRef = useRef<string | null>(user?.id || null);

  const clearSecretsOnAuthBoundaryChange = (nextUserId: string | null) => {
    const previousUserId = previousUserIdRef.current;
    if (previousUserId && previousUserId !== nextUserId) {
      clearAllVolatileAuthSecrets();
    }
    previousUserIdRef.current = nextUserId;
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
            clearSecretsOnAuthBoundaryChange(session.user.id);
            setUser(mapSessionToUser(session));
          } else {
            clearSecretsOnAuthBoundaryChange(null);
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
          clearSecretsOnAuthBoundaryChange(session.user.id);
          setUser(mapSessionToUser(session));
        } else {
          clearSecretsOnAuthBoundaryChange(null);
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

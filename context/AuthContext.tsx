import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { supabase } from '../src/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { useAuthStore } from '../hooks/useAuthStore';
import { StartupScreen } from '../components/ui/StartupScreen';
import { NATIVE_STARTUP_FADE_MS, NATIVE_STARTUP_MIN_MS } from '../src/native/appLaunch';
import {
  identifyAnalyticsUserDeferred,
  resetAnalyticsUserDeferred,
} from '../src/analytics/deferredEvents';

/** Duration of the OverlayFeedback exit animation (ms). */
const STARTUP_EXIT_ANIMATION_MS = 350;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialCheckDone: boolean;
  isAuthStoreHydrated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, setHydrated, setUser, logout, isHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [showStartup, setShowStartup] = useState(() => {
    return !sessionStorage.getItem('startup_shown');
  });
  const [minTimeReached, setMinTimeReached] = useState(false);
  // Tracks whether the exit animation has finished so pointer events
  // don't switch to 'auto' while the startup screen is still fading.
  const [startupExitDone, setStartupExitDone] = useState(!showStartup);
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

  // Keep the in-app launch moment visible long enough to feel intentional without stalling.
  useEffect(() => {
    if (showStartup) {
      const timer = setTimeout(() => {
        setMinTimeReached(true);
      }, NATIVE_STARTUP_MIN_MS);
      return () => clearTimeout(timer);
    }
  }, [showStartup]);

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
          setLoading(false);
          setHydrated(true);
        }
      } catch (err) {
        console.error('Fatal auth check error:', err);
        if (mounted) {
          setLoading(false);
          setHydrated(true);
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
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setHydrated]);


  // Hide startup screen
  useEffect(() => {
    if (!loading && minTimeReached && showStartup && isHydrated) {
      const fadeOutTimer = setTimeout(() => {
        setShowStartup(false);
        sessionStorage.setItem('startup_shown', 'true');
      }, NATIVE_STARTUP_FADE_MS);
      return () => clearTimeout(fadeOutTimer);
    }
  }, [loading, minTimeReached, showStartup, isHydrated]);

  // Wait for the exit animation to finish before enabling pointer events
  useEffect(() => {
    if (showStartup) {
      setStartupExitDone(false);
      return;
    }

    const timer = setTimeout(() => {
      setStartupExitDone(true);
    }, STARTUP_EXIT_ANIMATION_MS);

    return () => clearTimeout(timer);
  }, [showStartup]);

  const isStartupBlocking = showStartup || !startupExitDone;

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isInitialCheckDone: !loading && isHydrated,
      isAuthStoreHydrated: isHydrated,
      logout 
    }}>
      <StartupScreen isVisible={showStartup} />
      
      <div 
        className="flex min-h-0 flex-1 flex-col"
        aria-hidden={isStartupBlocking}
        style={{
          pointerEvents: isStartupBlocking ? 'none' : 'auto',
        }}
      >
        {children}
      </div>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

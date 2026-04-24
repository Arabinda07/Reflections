import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { supabase } from '../src/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { useAuthStore } from '../hooks/useAuthStore';
import { StartupScreen } from '../components/ui/StartupScreen';
import { identifyAnalyticsUser, resetAnalyticsUser } from '../src/analytics/events';
import { NATIVE_STARTUP_FADE_MS, NATIVE_STARTUP_MIN_MS } from '../src/native/appLaunch';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialCheckDone: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSessionToUser = (session: Session): User => ({
  id: session.user.id,
  email: session.user.email || '',
  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
  avatarUrl: session.user.user_metadata?.avatar_url,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, setHydrated, setUser, logout, isHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [showStartup, setShowStartup] = useState(() => {
    return !sessionStorage.getItem('startup_shown');
  });
  const [minTimeReached, setMinTimeReached] = useState(false);

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
          } else if (error) {
            console.warn('Supabase session check failed (likely offline). Using local persisted session.');
            // Session remains as it was in the persisted Zustand store
          } else {
            setUser(null);
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
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setHydrated]);

  useEffect(() => {
    if (loading || !isHydrated) {
      return;
    }

    if (user) {
      identifyAnalyticsUser(user);
      return;
    }

    resetAnalyticsUser();
  }, [user, loading, isHydrated]);

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

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isInitialCheckDone: !loading && isHydrated, 
      logout 
    }}>
      <StartupScreen isVisible={showStartup} />
      
      <div 
        className="flex-1 contents"
        style={{ 
          opacity: showStartup ? 0 : 1, 
          visibility: showStartup ? 'hidden' : 'visible',
          transition: `opacity ${NATIVE_STARTUP_FADE_MS}ms cubic-bezier(0.32, 0.72, 0, 1), visibility ${NATIVE_STARTUP_FADE_MS}ms`
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../src/supabaseClient';
import { Session } from '@supabase/supabase-js';

import { StartupScreen } from '../components/ui/StartupScreen';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialCheckDone: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to map Supabase session to our app User type
const mapSessionToUser = (session: Session): User => ({
  id: session.user.id,
  email: session.user.email || '',
  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
  avatarUrl: session.user.user_metadata?.avatar_url,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStartup, setShowStartup] = useState(true);
  const [minTimeReached, setMinTimeReached] = useState(false);

  // Minimum duration for the startup animation (3.5 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeReached(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initial session check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session) {
          setUser(mapSessionToUser(session));
        } else {
          setUser(null);
        }
        setLoading(false);
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
  }, []);

  // Hide startup screen only when both conditions are met
  useEffect(() => {
    if (!loading && minTimeReached) {
      // Extended delay to ensure the StartupScreen's exit animation (800ms) has time to finish
      const fadeOutTimer = setTimeout(() => {
        setShowStartup(false);
      }, 800);
      return () => clearTimeout(fadeOutTimer);
    }
  }, [loading, minTimeReached]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isInitialCheckDone: !loading, logout }}>
      {/* StartupScreen is a fixed overlay, so it doesn't interrupt the app mounting */}
      <StartupScreen isVisible={showStartup} />
      
      {/* 
        CRITICAL FIX: We always render children to keep the Router and its state alive.
        The StartupScreen covers it visually until we're ready.
      */}
      {children}
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

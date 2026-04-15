import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../src/supabaseClient';
import { Session } from '@supabase/supabase-js';

import { StartupScreen } from '../components/ui/StartupScreen';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStartup, setShowStartup] = useState(true);
  const [minTimeReached, setMinTimeReached] = useState(false);

  // Minimum duration for the startup animation (2 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeReached(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

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
      // Small delay before fading out to ensure state is stable
      const fadeOutTimer = setTimeout(() => {
        setShowStartup(false);
      }, 300);
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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, logout }}>
      <StartupScreen isVisible={showStartup} />
      {(!loading || !showStartup) && children}
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

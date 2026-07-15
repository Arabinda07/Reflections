import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../src/supabaseClient';
import { useAuthStore } from '../hooks/useAuthStore';
import type { UserMode } from '../services/privateMode';
import { setCurrentUserMode } from '../services/userModeStore';

interface UserModeContextValue {
  userMode: UserMode | null;
  isUserModeLoading: boolean;
  userModeError: boolean;
  refreshUserMode: () => Promise<void>;
}

const UserModeContext = createContext<UserModeContextValue>({ userMode: null, isUserModeLoading: true, userModeError: false, refreshUserMode: async () => {} });

export const UserModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const [userMode, setUserMode] = useState<UserMode | null>(null);
  const [isUserModeLoading, setIsUserModeLoading] = useState(true);
  const [userModeError, setUserModeError] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (!user?.id) {
      setUserMode(null);
      setCurrentUserMode(null);
      setUserModeError(false);
      setIsUserModeLoading(false);
      return;
    }

    loadMode(user.id, isActive);
    return () => { isActive = false; };
  }, [user?.id]);

  const loadMode = async (userId: string, isActive = true) => {
    setIsUserModeLoading(true);
    setUserModeError(false);
    const { data, error } = await supabase
      .from('profiles')
      .select('user_mode')
      .eq('id', userId)
      .maybeSingle();

    if (!isActive) return;

    if (error) {
      // Do NOT silently assume 'reflective' here: an encrypted user on a bad
      // network would be misclassified and could attempt plaintext writes.
      // Leave the mode unresolved and surface an error so the UI can retry.
      console.error('[UserModeContext] Error fetching user_mode:', error);
      setUserMode(null);
      setCurrentUserMode(null);
      setUserModeError(true);
      setIsUserModeLoading(false);
      return;
    }

    // A missing user_mode column value (never onboarded) safely defaults to
    // reflective; only genuine fetch failures are treated as errors above.
    const mode = (data?.user_mode as UserMode) ?? 'reflective';
    setUserMode(mode);
    setCurrentUserMode(mode);
    setIsUserModeLoading(false);
  };

  const refreshUserMode = async () => {
    if (!user?.id) return;
    await loadMode(user.id);
  };

  return (
    <UserModeContext.Provider value={{ userMode, isUserModeLoading, userModeError, refreshUserMode }}>
      {children}
    </UserModeContext.Provider>
  );
};

export const useUserMode = (): UserModeContextValue => {
  const context = useContext(UserModeContext);
  if (context === undefined) {
    throw new Error('useUserMode must be used within a UserModeProvider');
  }
  return context;
};

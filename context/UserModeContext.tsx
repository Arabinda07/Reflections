import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  // Wait for useAuthBootstrapper to validate (or invalidate) the JWT before
  // firing loadMode. Without this guard, a stale user.id rehydrated from
  // IndexedDB can race the session check and trigger a profile fetch with no
  // valid JWT — causing RLS to return data=null and trip the error boundary.
  const isInitialCheckDone = useAuthStore((state) => state.isInitialCheckDone);
  const [userMode, setUserMode] = useState<UserMode | null>(null);
  const [isUserModeLoading, setIsUserModeLoading] = useState(true);
  const [userModeError, setUserModeError] = useState(false);
  // Bumped on cleanup / newer request so stale fetches cannot overwrite state.
  const requestIdRef = useRef(0);

  const loadMode = useCallback(async (userId: string) => {
    const requestId = ++requestIdRef.current;
    setIsUserModeLoading(true);
    setUserModeError(false);
    const { data, error } = await supabase
      .from('profiles')
      .select('user_mode')
      .eq('id', userId)
      .maybeSingle();

    if (requestId !== requestIdRef.current) return;

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

    // Missing profile row (signup lag / RLS hide) must fail closed — do not
    // invent a reflective mode before the permanent choice is resolved.
    if (data == null) {
      console.error('[UserModeContext] Profile row missing while resolving user_mode');
      setUserMode(null);
      setCurrentUserMode(null);
      setUserModeError(true);
      setIsUserModeLoading(false);
      return;
    }

    // A missing user_mode column value (never onboarded) safely defaults to
    // reflective; only genuine fetch failures / missing rows are errors above.
    const mode = (data.user_mode as UserMode) ?? 'reflective';
    setUserMode(mode);
    setCurrentUserMode(mode);
    setIsUserModeLoading(false);
  }, []);

  useEffect(() => {
    if (!isInitialCheckDone) {
      // JWT validation is still in-flight. Stay in loading state and let the
      // effect re-run once useAuthBootstrapper settles. This prevents a stale
      // IndexedDB user.id from triggering a profile fetch with an expired token.
      return;
    }

    if (!user?.id) {
      requestIdRef.current += 1;
      setUserMode(null);
      setCurrentUserMode(null);
      setUserModeError(false);
      setIsUserModeLoading(false);
      return;
    }

    void loadMode(user.id);
    return () => { requestIdRef.current += 1; };
  }, [user?.id, loadMode, isInitialCheckDone]);

  const refreshUserMode = useCallback(async () => {
    if (!user?.id) return;
    await loadMode(user.id);
  }, [user?.id, loadMode]);

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

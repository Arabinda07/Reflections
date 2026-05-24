import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../src/supabaseClient';
import { useNetworkState } from './useNetworkState';
import { useAuthStore } from './useAuthStore';
import { getCurrentCryptoSession } from '../services/cryptoSessionStore';
import { syncEngine } from '../services/syncEngine';

/**
 * useSync hook
 * 
 * Re-engineered for Dexie-based status tracking.
 * Automatically synchronizes pending notes when connectivity is restored.
 */
export const useSync = () => {
  const { isAuthenticated } = useAuthStore();
  const isOnline = useNetworkState();
  const isSyncing = useRef(false);

  const sync = useCallback(async () => {
    // 1. Guards
    if (!isOnline || isSyncing.current) return;

    // 2. Auth Check - Rely on context state to avoid racing with code exchange
    if (!isAuthenticated) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (!getCurrentCryptoSession()) return;

    isSyncing.current = true;
    try {
      await syncEngine.flush(session.user.id);
    } finally {
      isSyncing.current = false;
    }
  }, [isOnline, isAuthenticated]);

  useEffect(() => {
    if (isOnline) {
      sync();
    }
  }, [isOnline, sync]);

  return { sync };
};

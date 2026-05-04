import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { User } from '../types';
import { supabase } from '../src/supabaseClient';

// Custom storage engine using idb-keyval as requested
const storage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isInitialCheckDone: boolean;
  setUser: (user: User | null) => void;
  setHydrated: (val: boolean) => void;
  setInitialCheckDone: (val: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      isInitialCheckDone: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setHydrated: (isHydrated) => set({ isHydrated }),
      setInitialCheckDone: (isInitialCheckDone) => set({ isInitialCheckDone }),
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'reflections-auth-storage',
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

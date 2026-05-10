import type { AuthAdapter } from './AuthAdapter';
import { SupabaseAuthAdapter } from './SupabaseAuthAdapter';

const supabaseAuthAdapter = new SupabaseAuthAdapter();

let currentAuthAdapter: AuthAdapter = supabaseAuthAdapter;

export const getAuthAdapter = (): AuthAdapter => currentAuthAdapter;

export const setAuthAdapterForTest = (adapter: AuthAdapter): void => {
  currentAuthAdapter = adapter;
};

export const resetAuthAdapterForTest = (): void => {
  currentAuthAdapter = supabaseAuthAdapter;
};

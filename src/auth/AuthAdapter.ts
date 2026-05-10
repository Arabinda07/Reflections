import type { Provider, Session, User } from '@supabase/supabase-js';

/** The shallow seam that all auth-related code talks to. */
export interface AuthAdapter {
  /** Current user ID, or null if not signed in. */
  getUserId(): Promise<string | null>;

  /** Current Supabase user, or null if not signed in. */
  getUser(): Promise<User | null>;

  /** Full Supabase session, or null. */
  getSession(): Promise<Session | null>;

  /** Initiates the sign-in flow. */
  signIn(provider?: Provider): Promise<void>;

  /** Signs the user out and clears local auth state. */
  signOut(): Promise<void>;

  /** Subscribe to auth-state changes; returns an unsubscribe fn. */
  onAuthChange(cb: (session: Session | null) => void): () => void;
}

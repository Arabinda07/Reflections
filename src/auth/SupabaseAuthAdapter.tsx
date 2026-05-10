import type { Provider, Session, User } from '@supabase/supabase-js';

import { supabase } from '../supabaseClient';
import type { AuthAdapter } from './AuthAdapter';

/** Concrete AuthAdapter implementation using Supabase. */
export class SupabaseAuthAdapter implements AuthAdapter {
  private session: Session | null = null;

  async getUserId(): Promise<string | null> {
    return (await this.getUser())?.id ?? null;
  }

  async getUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    this.session = data.session;
    return this.session;
  }

  async signIn(provider: Provider = 'github'): Promise<void> {
    await supabase.auth.signInWithOAuth({ provider });
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    this.session = null;
  }

  onAuthChange(cb: (session: Session | null) => void): () => void {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      this.session = session;
      cb(session);
    });
    return () => subscription.unsubscribe();
  }
}

import type { Session, User } from '@supabase/supabase-js';

import type { AuthAdapter } from '../AuthAdapter';

export class MockAuthAdapter implements AuthAdapter {
  private session: Session | null;

  constructor(session: Session | null = null) {
    this.session = session;
  }

  async getUserId(): Promise<string | null> {
    return this.session?.user.id ?? 'mock-user-123';
  }

  async getUser(): Promise<User | null> {
    return this.session?.user ?? ({ id: 'mock-user-123', email: 'mock@example.com' } as User);
  }

  async getSession(): Promise<Session | null> {
    return this.session;
  }

  async signIn(): Promise<void> {}

  async signOut(): Promise<void> {
    this.session = null;
  }

  onAuthChange(cb: (session: Session | null) => void): () => void {
    cb(this.session);
    return () => {};
  }
}

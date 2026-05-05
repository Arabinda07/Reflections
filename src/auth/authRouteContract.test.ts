import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('auth route session handoff contract', () => {
  it('commits a Supabase session before redirecting from auth flows', () => {
    const callback = read('pages/auth/AuthCallback.tsx');
    const signIn = read('pages/auth/SignIn.tsx');
    const signUp = read('pages/auth/SignUp.tsx');
    const sessionUser = read('src/auth/sessionUser.ts');

    expect(sessionUser).toContain('export const commitAuthSession');
    expect(sessionUser).toContain('setUser(mapSessionToUser(session));');
    expect(sessionUser).toContain('setInitialCheckDone(true);');

    expect(callback).toContain('commitAuthSession(session);');
    expect(callback).toContain('Session could not be established after code exchange.');
    expect(signIn).toContain('commitAuthSession(data.session);');
    expect(signIn).toContain('commitAuthSession(authResult.data.session);');
    expect(signUp).toContain('commitAuthSession(data.session);');
    expect(signUp).toContain('commitAuthSession(authResult.data.session);');
  });
});

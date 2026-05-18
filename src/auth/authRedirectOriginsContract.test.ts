import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('auth redirect origin contract', () => {
  it('keeps browser auth callbacks tied to the current origin', () => {
    const googleOAuth = read('src/auth/googleOAuth.ts');
    const signIn = read('pages/auth/SignIn.tsx');
    const signUp = read('pages/auth/SignUp.tsx');
    const account = read('pages/dashboard/Account.tsx');
    const callback = read('pages/auth/AuthCallback.tsx');

    expect(googleOAuth).toContain('`${window.location.origin}${RoutePath.AUTH_CALLBACK}`');
    expect(signIn).toContain('`${window.location.origin}${RoutePath.AUTH_CALLBACK}?next=${RoutePath.RESET_PASSWORD}`');
    expect(signUp).toContain('emailRedirectTo: `${window.location.origin}${RoutePath.AUTH_CALLBACK}`');
    expect(account).toContain('`${window.location.origin}${RoutePath.AUTH_CALLBACK}?next=${RoutePath.RESET_PASSWORD}`');
    expect(callback).toContain('new URL(nextPath, window.location.origin)');
    expect(callback).toContain('if (url.origin !== window.location.origin) return null;');
  });

  it('does not hardcode the canonical web domain into browser auth redirects', () => {
    const googleOAuth = read('src/auth/googleOAuth.ts');
    const signIn = read('pages/auth/SignIn.tsx');
    const signUp = read('pages/auth/SignUp.tsx');
    const account = read('pages/dashboard/Account.tsx');

    for (const source of [googleOAuth, signIn, signUp, account]) {
      expect(source).not.toContain('https://www.reflections-sanctuary.space/auth/callback');
      expect(source).not.toContain('https://reflections-ebon.vercel.app/auth/callback');
    }
  });
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('auth redirect origin contract', () => {
  it('keeps browser auth callbacks tied to the current origin', () => {
    const config = read('src/auth/authRedirectConfig.ts');
    const googleOAuth = read('src/auth/googleOAuth.ts');
    const signIn = read('pages/auth/SignIn.tsx');
    const signUp = read('pages/auth/SignUp.tsx');
    const account = read('pages/dashboard/Account.tsx');
    const callback = read('pages/auth/AuthCallback.tsx');

    expect(config).toContain('getBrowserAuthCallbackUrl');
    expect(config).toContain('window.location.origin');
    expect(config).toContain('getPasswordResetRedirectTo');
    expect(config).toContain('getSignupEmailRedirectTo');
    expect(config).toContain('resolveSafeCallbackNextPath');
    expect(googleOAuth).toContain('getOAuthRedirectTo');
    expect(signIn).toContain('getPasswordResetRedirectTo()');
    expect(signUp).toContain('emailRedirectTo: getSignupEmailRedirectTo()');
    expect(account).toContain('getPasswordResetRedirectTo()');
    expect(callback).toContain('resolveSafeCallbackNextPath(nextPath)');
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

  it('documents external auth allow-list values that must match the redirect config', () => {
    const envExample = read('.env.example');
    const vercel = read('vercel.json');

    expect(envExample).toContain('Supabase Auth URL allow-list');
    expect(envExample).toContain('https://www.reflections-sanctuary.space/auth/callback');
    expect(envExample).toContain('http://localhost:3000/auth/callback');
    expect(envExample).toContain('https://*-*.vercel.app/auth/callback');
    expect(envExample).toContain('com.arabinda.reflections://auth/callback');
    expect(vercel).toContain('"source": "/auth/:path*"');
    expect(vercel).toContain('"source": "/reset-password"');
  });
});

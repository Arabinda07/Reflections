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
    expect(callback).toContain('if (session) {');
    expect(signIn).toContain('commitAuthSession(data.session);');
    expect(signIn).toContain('commitAuthSession(authResult.data.session);');
    expect(signUp).toContain('commitAuthSession(data.session);');
    expect(signUp).toContain('commitAuthSession(authResult.data.session);');
  });

  it('keeps Supabase callback redirects specific to recovery and signup confirmations', () => {
    const callback = read('pages/auth/AuthCallback.tsx');
    const signIn = read('pages/auth/SignIn.tsx');
    const signUp = read('pages/auth/SignUp.tsx');

    expect(callback).toContain("const code = params.get('code');");
    expect(callback).toContain("const error = params.get('error');");
    expect(callback).toContain("const errorDescription = params.get('error_description');");
    expect(callback).toContain("const nextPath = params.get('next');");
    expect(callback).toContain('const pendingSourcePath = getPendingGoogleAuthPath();');
    expect(callback).toContain('const safeNextPath = resolveSafeNextPath(nextPath);');
    expect(callback).toContain('return RoutePath.RESET_PASSWORD;');
    expect(callback).toContain('navigate(safeNextPath, { replace: true });');
    expect(callback).toContain('consumePendingGoogleAuthRedirectPath(pendingSourcePath)');
    expect(callback).toContain('navigate(RoutePath.DASHBOARD, {');
    expect(callback).toContain('successMessage: SIGNUP_CONFIRMATION_SUCCESS');
    expect(callback).toContain('navigateWithFeedback(navigate, RoutePath.LOGIN, {');
    expect(callback).toContain('successMessage: LOGIN_CONFIRMATION_SUCCESS');
    expect(callback).toContain('errorMessage:');
    expect(callback).not.toContain('stashGoogleAuthError');
    expect(signIn).toContain("location.state?.errorMessage || null");
    expect(signUp).toContain("location.state?.errorMessage || null");
  });
});

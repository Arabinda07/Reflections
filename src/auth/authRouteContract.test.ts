import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('auth route session handoff contract', () => {
  it('keeps auth route lazy waits on a quiet paper surface', () => {
    const app = read('App.tsx');

    expect(app).toContain('const authRouteFallback = (');
    expect(app).toContain('className="surface-scope-paper page-wash min-h-[100dvh] bg-body"');
    expect(app).toContain('const withAuthRouteFallback = (element: React.ReactNode) =>');
    expect(app).toContain('withRouteFallback(element, authRouteFallback);');
    expect(app).toContain('<Route element={withRouteFallback(<AuthAppShell />, authRouteFallback)} errorElement={<RouteErrorBoundary />}>');
    expect(app).toContain('path={RoutePath.LOGIN} element={withAuthRouteFallback(<SignIn />)}');
    expect(app).toContain('path={RoutePath.SIGNUP} element={withAuthRouteFallback(<SignUp />)}');
    expect(app).toContain('path={RoutePath.RESET_PASSWORD} element={withAuthRouteFallback(<ResetPassword />)}');
    expect(app).toContain('path={RoutePath.AUTH_CALLBACK} element={withAuthRouteFallback(<AuthCallback />)}');
    expect(app).toContain('const defaultRouteFallback = <RouteLoadingFrame />;');
    expect(app).toContain('path={RoutePath.HOME} element={<LandingRoute />}');
  });

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

  it('hands off account passwords only after immediate email-password sessions', () => {
    const signIn = read('pages/auth/SignIn.tsx');
    const signUp = read('pages/auth/SignUp.tsx');
    const authStore = read('hooks/useAuthStore.ts');

    expect(signIn).toContain('storePendingAccountPassword(password, data.session.user.id);');
    expect(signIn).toContain('if (data.session) {');
    expect(signIn).toContain('commitAuthSession(data.session);');
    expect(signUp).toContain('storePendingAccountPassword(password, data.session.user.id);');
    expect(signUp).toContain('} else if (data.session) {');
    expect(signUp).toContain('commitAuthSession(data.session);');
    expect(authStore).toContain('clearAllVolatileAuthSecrets');
    expect(authStore).not.toContain('clearPendingAccountPassword');
    expect(authStore).not.toContain('clearPendingResetAccountPassword');
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
    expect(callback).toContain('const safeNextPath = resolveSafeCallbackNextPath(nextPath);');
    expect(read('src/auth/authRedirectConfig.ts')).toContain('return RoutePath.RESET_PASSWORD;');
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

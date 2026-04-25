import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { RoutePath } from '../../types';
import {
  consumeGoogleAuthError,
  consumeNativeGoogleOAuthCallback,
  consumeNativeGoogleAuthSuccessRedirectPath,
  consumePendingGoogleAuthRedirectPath,
  resolvePostAuthRedirectPath,
  startGoogleOAuthFlow,
} from './googleOAuth';
import { supabase } from '../supabaseClient';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      setSession: vi.fn(),
    },
  },
}));

const mockSignInWithOAuth = vi.mocked(supabase.auth.signInWithOAuth);
const mockExchangeCodeForSession = vi.mocked(supabase.auth.exchangeCodeForSession);
const mockSetSession = vi.mocked(supabase.auth.setSession);
const mockIsNativePlatform = vi.mocked(Capacitor.isNativePlatform);

class SessionStorageMock {
  private readonly store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

const createWindow = (href = 'https://reflections-ebon.vercel.app/#/login') => ({
  location: {
    origin: 'https://reflections-ebon.vercel.app',
    pathname: '/',
    href,
    replace: vi.fn(),
  },
  sessionStorage: new SessionStorageMock(),
  matchMedia: vi.fn(() => ({ matches: true })),
});

const getSessionStorage = () => (globalThis as any).window.sessionStorage as SessionStorageMock;

describe('googleOAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (globalThis as any).window = createWindow();
    mockIsNativePlatform.mockReturnValue(false);

    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' },
      error: null,
    } as any);
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: {} },
      error: null,
    } as any);
    mockSetSession.mockResolvedValue({
      data: { session: {} },
      error: null,
    } as any);
  });

  it('stores the source route and a safe redirect before launching Supabase OAuth', async () => {
    await startGoogleOAuthFlow({
      sourcePath: RoutePath.LOGIN,
      redirectPath: '/notes?tab=recent#focus',
    });

    const sessionStorage = getSessionStorage();

    expect(sessionStorage.getItem('reflections.pending-google-auth-path')).toBe(RoutePath.LOGIN);
    expect(sessionStorage.getItem('reflections.pending-google-auth-redirect-path')).toBe('/notes?tab=recent#focus');
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://reflections-ebon.vercel.app/#/login',
      },
    });
  });

  it('cleans up stored intent when Supabase refuses to launch Google OAuth', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: { url: null },
      error: { message: 'Google is unavailable right now.' },
    } as any);

    const result = await startGoogleOAuthFlow({
      sourcePath: RoutePath.SIGNUP,
      redirectPath: 'https://evil.example.com/phish',
    });

    const sessionStorage = getSessionStorage();

    expect(result).toBe('Google is unavailable right now.');
    expect(sessionStorage.getItem('reflections.pending-google-auth-path')).toBeNull();
    expect(sessionStorage.getItem('reflections.pending-google-auth-redirect-path')).toBeNull();
  });

  it('uses the native app callback when Google OAuth launches inside Capacitor', async () => {
    mockIsNativePlatform.mockReturnValue(true);

    await startGoogleOAuthFlow({
      sourcePath: RoutePath.LOGIN,
      redirectPath: RoutePath.NOTES,
    });

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'com.arabinda.reflections://auth/callback',
      },
    });
  });

  it('defaults post-auth redirects to notes when the requested path is unsafe', () => {
    expect(resolvePostAuthRedirectPath(undefined)).toBe(RoutePath.HOME);
    expect(resolvePostAuthRedirectPath({ pathname: RoutePath.LOGIN })).toBe(RoutePath.HOME);
    expect(resolvePostAuthRedirectPath({ pathname: 'https://evil.example.com' })).toBe(RoutePath.HOME);
  });

  it('consumes a matching stored Google auth error and clears the pending state', () => {
    const sessionStorage = getSessionStorage();
    sessionStorage.setItem('reflections.pending-google-auth-path', RoutePath.LOGIN);
    sessionStorage.setItem('reflections.pending-google-auth-redirect-path', RoutePath.NOTES);
    sessionStorage.setItem('reflections.google-auth-error', 'Google access was denied.');

    expect(consumeGoogleAuthError(RoutePath.LOGIN)).toBe('Google access was denied.');
    expect(sessionStorage.getItem('reflections.pending-google-auth-path')).toBeNull();
    expect(sessionStorage.getItem('reflections.pending-google-auth-redirect-path')).toBeNull();
    expect(sessionStorage.getItem('reflections.google-auth-error')).toBeNull();
  });

  it('reads Google callback errors from the current URL on the matching auth route', () => {
    (globalThis as any).window = createWindow(
      'https://reflections-ebon.vercel.app/?error_description=Account%20is%20not%20allowed#/signup',
    );

    const sessionStorage = getSessionStorage();
    sessionStorage.setItem('reflections.pending-google-auth-path', RoutePath.SIGNUP);
    sessionStorage.setItem('reflections.pending-google-auth-redirect-path', RoutePath.NOTES);

    expect(consumeGoogleAuthError(RoutePath.SIGNUP)).toBe('Account is not allowed');
    expect(sessionStorage.getItem('reflections.pending-google-auth-path')).toBeNull();
    expect(sessionStorage.getItem('reflections.pending-google-auth-redirect-path')).toBeNull();
  });

  it('returns the stored redirect for the matching auth route after session completion and clears it', () => {
    const sessionStorage = getSessionStorage();
    sessionStorage.setItem('reflections.pending-google-auth-path', RoutePath.LOGIN);
    sessionStorage.setItem('reflections.pending-google-auth-redirect-path', '/notes?view=week');

    expect(consumePendingGoogleAuthRedirectPath(RoutePath.LOGIN)).toBe('/notes?view=week');
    expect(sessionStorage.getItem('reflections.pending-google-auth-path')).toBeNull();
    expect(sessionStorage.getItem('reflections.pending-google-auth-redirect-path')).toBeNull();
  });

  it('does not consume a redirect when no Google auth flow is pending', () => {
    const sessionStorage = getSessionStorage();

    expect(consumePendingGoogleAuthRedirectPath(RoutePath.LOGIN)).toBeNull();
    expect(sessionStorage.getItem('reflections.pending-google-auth-path')).toBeNull();
    expect(sessionStorage.getItem('reflections.pending-google-auth-redirect-path')).toBeNull();
  });

  it('sends a successful native Google return to home and clears the pending redirect state', () => {
    const sessionStorage = getSessionStorage();
    sessionStorage.setItem('reflections.pending-google-auth-path', RoutePath.LOGIN);
    sessionStorage.setItem('reflections.pending-google-auth-redirect-path', '/notes/new');

    expect(consumeNativeGoogleAuthSuccessRedirectPath(RoutePath.LOGIN)).toBe(RoutePath.HOME);
    expect(sessionStorage.getItem('reflections.pending-google-auth-path')).toBeNull();
    expect(sessionStorage.getItem('reflections.pending-google-auth-redirect-path')).toBeNull();
  });

  it('exchanges the native callback code for a session', async () => {
    const result = await consumeNativeGoogleOAuthCallback(
      'https://reflections-ebon.vercel.app/?code=oauth-code',
    );

    expect(result).toEqual({ handled: true, success: true });
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('oauth-code');
  });

  it('returns native callback errors without attempting a session exchange', async () => {
    const result = await consumeNativeGoogleOAuthCallback(
      'https://reflections-ebon.vercel.app/?error=access_denied',
    );

    expect(result).toEqual({
      handled: true,
      success: false,
      error: 'access_denied',
    });
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  it('accepts the app callback scheme when exchanging the native Google session', async () => {
    const result = await consumeNativeGoogleOAuthCallback(
      'com.arabinda.reflections://auth/callback?code=oauth-code',
    );

    expect(result).toEqual({ handled: true, success: true });
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('oauth-code');
  });
});

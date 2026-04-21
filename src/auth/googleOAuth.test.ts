import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoutePath } from '../../types';
import { resolvePostAuthRedirectPath, startGoogleOAuthFlow } from './googleOAuth';
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
      getSession: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      setSession: vi.fn(),
    },
  },
}));

const mockSignInWithOAuth = vi.mocked(supabase.auth.signInWithOAuth);

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

describe('googleOAuth', () => {
  const sessionStorage = new SessionStorageMock();
  const locationAssign = vi.fn();
  const locationReplace = vi.fn();
  const openWindow = vi.fn(() => null);

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    (globalThis as any).window = {
      location: {
        origin: 'https://reflections-ebon.vercel.app',
        pathname: '/',
        href: 'https://reflections-ebon.vercel.app/#/login',
        assign: locationAssign,
        replace: locationReplace,
      },
      sessionStorage,
      matchMedia: vi.fn(() => ({ matches: true })),
      open: openWindow,
      screenX: 0,
      screenY: 0,
      outerWidth: 1440,
      outerHeight: 900,
      setInterval,
      clearInterval,
    };

    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' },
      error: null,
    } as any);
  });

  it('uses same-window redirect flow even on desktop-like browsers', async () => {
    await startGoogleOAuthFlow({
      sourcePath: RoutePath.LOGIN,
      onSuccess: vi.fn(),
      onError: vi.fn(),
      onComplete: vi.fn(),
    });

    expect(mockSignInWithOAuth).toHaveBeenCalledTimes(1);
    expect(mockSignInWithOAuth.mock.calls[0][0].options).not.toHaveProperty('skipBrowserRedirect');
    expect(openWindow).not.toHaveBeenCalled();
    expect(locationAssign).not.toHaveBeenCalled();
  });

  it('remembers the intended post-login route for the OAuth round-trip', async () => {
    await startGoogleOAuthFlow({
      sourcePath: RoutePath.LOGIN,
      redirectPath: RoutePath.NOTES,
      onSuccess: vi.fn(),
      onError: vi.fn(),
      onComplete: vi.fn(),
    } as any);

    expect(sessionStorage.getItem('reflections.pending-google-auth-redirect-path')).toBe(RoutePath.NOTES);
  });

  it('defaults post-login redirects to the user notes home when no protected route was requested', () => {
    expect(resolvePostAuthRedirectPath(undefined)).toBe(RoutePath.NOTES);
    expect(resolvePostAuthRedirectPath(null)).toBe(RoutePath.NOTES);
    expect(resolvePostAuthRedirectPath({ pathname: RoutePath.LOGIN })).toBe(RoutePath.NOTES);
  });
});

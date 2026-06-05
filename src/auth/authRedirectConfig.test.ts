import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { RoutePath } from '../../types';
import {
  getBrowserAuthCallbackUrl,
  getNativeOAuthRedirectTo,
  getOAuthRedirectTo,
  getPasswordResetRedirectTo,
  getSignupEmailRedirectTo,
  resolveSafeCallbackNextPath,
  resolveSafePostAuthRedirectPath,
} from './authRedirectConfig';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

const mockIsNativePlatform = vi.mocked(Capacitor.isNativePlatform);

const setWindowOrigin = (origin: string) => {
  (globalThis as any).window = {
    location: {
      origin,
    },
  };
};

describe('auth redirect config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsNativePlatform.mockReturnValue(false);
    setWindowOrigin('https://www.reflections-sanctuary.space');
  });

  it('builds browser auth callbacks from the current origin', () => {
    expect(getBrowserAuthCallbackUrl()).toBe(
      'https://www.reflections-sanctuary.space/auth/callback',
    );
    expect(getBrowserAuthCallbackUrl('http://localhost:3000')).toBe(
      'http://localhost:3000/auth/callback',
    );
    expect(getBrowserAuthCallbackUrl('https://reflections-git-feature-team.vercel.app')).toBe(
      'https://reflections-git-feature-team.vercel.app/auth/callback',
    );
  });

  it('builds password reset and signup email redirects from the same callback', () => {
    expect(getPasswordResetRedirectTo('https://www.reflections-sanctuary.space')).toBe(
      'https://www.reflections-sanctuary.space/auth/callback?next=/reset-password',
    );
    expect(getSignupEmailRedirectTo('https://www.reflections-sanctuary.space')).toBe(
      'https://www.reflections-sanctuary.space/auth/callback',
    );
    expect(getPasswordResetRedirectTo('https://www.reflections-sanctuary.space')).not.toContain(
      'com.arabinda.reflections://',
    );
    expect(getSignupEmailRedirectTo('https://www.reflections-sanctuary.space')).not.toContain(
      'com.arabinda.reflections://',
    );
  });

  it('requires a browser origin for browser-only callbacks', () => {
    delete (globalThis as any).window;

    expect(() => getBrowserAuthCallbackUrl()).toThrow('browser origin is required');
    expect(() => getPasswordResetRedirectTo()).toThrow('browser origin is required');
    expect(() => getSignupEmailRedirectTo()).toThrow('browser origin is required');
  });

  it('uses the native callback for Capacitor OAuth', () => {
    mockIsNativePlatform.mockReturnValue(true);

    expect(getNativeOAuthRedirectTo()).toBe('com.arabinda.reflections://auth/callback');
    expect(getOAuthRedirectTo()).toBe('com.arabinda.reflections://auth/callback');
  });

  it('rejects unsafe callback next paths and only allows reset password', () => {
    const origin = 'https://www.reflections-sanctuary.space';

    expect(resolveSafeCallbackNextPath('/reset-password', origin)).toBe(RoutePath.RESET_PASSWORD);
    expect(resolveSafeCallbackNextPath(`${origin}/reset-password`, origin)).toBe(RoutePath.RESET_PASSWORD);
    expect(resolveSafeCallbackNextPath('https://evil.example/reset-password', origin)).toBeNull();
    expect(resolveSafeCallbackNextPath('/reset-password?x=1', origin)).toBeNull();
    expect(resolveSafeCallbackNextPath('/notes', origin)).toBeNull();
  });

  it('normalizes unsafe post-auth redirect values away from auth loops', () => {
    expect(resolveSafePostAuthRedirectPath(undefined)).toBe(RoutePath.DASHBOARD);
    expect(resolveSafePostAuthRedirectPath({ pathname: RoutePath.LOGIN })).toBe(RoutePath.DASHBOARD);
    expect(resolveSafePostAuthRedirectPath({ pathname: RoutePath.SIGNUP })).toBe(RoutePath.DASHBOARD);
    expect(resolveSafePostAuthRedirectPath({ pathname: RoutePath.AUTH_CALLBACK })).toBe(RoutePath.DASHBOARD);
    expect(resolveSafePostAuthRedirectPath({ pathname: '/notes', search: '?view=week', hash: '#today' }))
      .toBe('/notes?view=week#today');
  });
});

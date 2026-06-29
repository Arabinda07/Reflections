import { Capacitor } from '@capacitor/core';
import { RoutePath } from '../../types';

const NATIVE_OAUTH_REDIRECT_TO = 'com.arabinda.reflections://auth/callback';

const getCurrentOrigin = () => {
  if (typeof window === 'undefined') return null;
  return window.location.origin;
};

const requireBrowserOrigin = (origin = getCurrentOrigin()) => {
  if (!origin) {
    throw new Error('A browser origin is required to build a browser auth callback URL.');
  }

  return origin;
};

export const getBrowserAuthCallbackUrl = (origin = getCurrentOrigin()) => {
  return `${requireBrowserOrigin(origin)}${RoutePath.AUTH_CALLBACK}`;
};

export const getPasswordResetRedirectTo = (origin = getCurrentOrigin()) =>
  `${getBrowserAuthCallbackUrl(origin)}?next=${RoutePath.RESET_PASSWORD}`;

export const getSignupEmailRedirectTo = (origin = getCurrentOrigin()) =>
  getBrowserAuthCallbackUrl(origin);

export const getNativeOAuthRedirectTo = () => NATIVE_OAUTH_REDIRECT_TO;

export const getOAuthRedirectTo = () =>
  typeof window !== 'undefined' && !Capacitor.isNativePlatform()
    ? getBrowserAuthCallbackUrl(window.location.origin)
    : getNativeOAuthRedirectTo();

export const resolveSafePostAuthRedirectPath = (value?: unknown) => {
  if (typeof value !== 'object' || value === null) {
    return RoutePath.DASHBOARD;
  }

  const candidate = value as {
    pathname?: unknown;
    search?: unknown;
    hash?: unknown;
  };

  const pathname =
    typeof candidate.pathname === 'string' && candidate.pathname.startsWith('/')
      ? candidate.pathname
      : RoutePath.DASHBOARD;

  if (
    pathname === RoutePath.LOGIN ||
    pathname === RoutePath.SIGNUP ||
    pathname === RoutePath.AUTH_CALLBACK
  ) {
    return RoutePath.DASHBOARD;
  }

  const search = typeof candidate.search === 'string' ? candidate.search : '';
  const hash = typeof candidate.hash === 'string' ? candidate.hash : '';

  return `${pathname}${search}${hash}`;
};

export const resolveSafeCallbackNextPath = (
  nextPath: string | null,
  origin = getCurrentOrigin(),
) => {
  if (!nextPath || !origin) return null;

  try {
    const url = new URL(nextPath, origin);
    if (url.origin !== origin) return null;
    if (url.pathname === RoutePath.RESET_PASSWORD && !url.search && !url.hash) {
      return RoutePath.RESET_PASSWORD;
    }
    if (
      url.pathname === RoutePath.RELATIONSHIPS &&
      (url.search === '' || url.search === '?tab=import') &&
      !url.hash
    ) {
      return `${RoutePath.RELATIONSHIPS}${url.search}`;
    }

    return null;
  } catch {
    return null;
  }
};

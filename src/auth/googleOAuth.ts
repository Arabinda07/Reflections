import { Capacitor } from '@capacitor/core';
import { RoutePath } from '../../types';
import { supabase } from '../supabaseClient';

const PENDING_GOOGLE_AUTH_PATH_KEY = 'reflections.pending-google-auth-path';
const PENDING_GOOGLE_AUTH_REDIRECT_PATH_KEY = 'reflections.pending-google-auth-redirect-path';
const GOOGLE_AUTH_ERROR_KEY = 'reflections.google-auth-error';
export const LAST_HANDLED_NATIVE_URL_KEY = 'reflections.last-handled-native-url';
// Native apps should return through an app link, not back into the public web origin.
const NATIVE_GOOGLE_AUTH_REDIRECT_URL = 'com.arabinda.reflections://auth/callback';

let isLaunchingOAuth = false;

type GoogleAuthSourcePath = RoutePath.LOGIN | RoutePath.SIGNUP;

type NativeGoogleOAuthResult =
  | { handled: false }
  | { handled: true; success: true }
  | { handled: true; success: false; error: string };

const hasWindow = () => typeof window !== 'undefined';

const parseAuthParams = (urlString: string) => {
  const url = new URL(urlString);
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);

  return {
    url,
    code: url.searchParams.get('code'),
    error:
      url.searchParams.get('error_description') ||
      url.searchParams.get('error') ||
      hashParams.get('error_description') ||
      hashParams.get('error'),
    accessToken: hashParams.get('access_token'),
    refreshToken: hashParams.get('refresh_token'),
    hasAuthParams:
      Boolean(url.searchParams.get('code')) ||
      Boolean(url.searchParams.get('error')) ||
      Boolean(url.searchParams.get('error_description')) ||
      Boolean(hashParams.get('access_token')) ||
      Boolean(hashParams.get('error')) ||
      Boolean(hashParams.get('error_description')),
    };
};

export const getGoogleOAuthRedirectTo = () => {
  if (!hasWindow()) {
    return NATIVE_GOOGLE_AUTH_REDIRECT_URL;
  }

  return Capacitor.isNativePlatform()
    ? NATIVE_GOOGLE_AUTH_REDIRECT_URL
    : `${window.location.origin}${RoutePath.AUTH_CALLBACK}`;
};

export const resolvePostAuthRedirectPath = (value?: unknown) => {
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

export const rememberPendingGoogleAuth = ({
  sourcePath,
  redirectPath = RoutePath.HOME,
}: {
  sourcePath: GoogleAuthSourcePath;
  redirectPath?: string;
}) => {
  if (!hasWindow()) {
    return;
  }

  window.sessionStorage.setItem(PENDING_GOOGLE_AUTH_PATH_KEY, sourcePath);
  window.sessionStorage.setItem(
    PENDING_GOOGLE_AUTH_REDIRECT_PATH_KEY,
    redirectPath.startsWith('/')
      ? resolvePostAuthRedirectPath(new URL(redirectPath, window.location.origin))
      : RoutePath.HOME,
  );
  window.sessionStorage.removeItem(GOOGLE_AUTH_ERROR_KEY);
};

export const clearPendingGoogleAuth = () => {
  if (!hasWindow()) {
    return;
  }

  window.sessionStorage.removeItem(PENDING_GOOGLE_AUTH_PATH_KEY);
  window.sessionStorage.removeItem(PENDING_GOOGLE_AUTH_REDIRECT_PATH_KEY);
  window.sessionStorage.removeItem(GOOGLE_AUTH_ERROR_KEY);
};

export const getPendingGoogleAuthPath = (): GoogleAuthSourcePath | null => {
  if (!hasWindow()) {
    return null;
  }

  const value = window.sessionStorage.getItem(PENDING_GOOGLE_AUTH_PATH_KEY);
  if (value === RoutePath.LOGIN || value === RoutePath.SIGNUP) {
    return value;
  }

  return null;
};

export const getPendingGoogleAuthRedirectPath = () => {
  if (!hasWindow()) {
    return RoutePath.HOME;
  }

  return window.sessionStorage.getItem(PENDING_GOOGLE_AUTH_REDIRECT_PATH_KEY) || RoutePath.HOME;
};

export const consumePendingGoogleAuthRedirectPath = (sourcePath: GoogleAuthSourcePath) => {
  if (!hasWindow()) {
    return null;
  }

  const pendingPath = getPendingGoogleAuthPath();
  if (pendingPath !== sourcePath) {
    return null;
  }

  const redirectPath = getPendingGoogleAuthRedirectPath();
  clearPendingGoogleAuth();
  return redirectPath;
};

export const consumeNativeGoogleAuthSuccessRedirectPath = (
  sourcePath: GoogleAuthSourcePath,
) => {
  return consumePendingGoogleAuthRedirectPath(sourcePath) || RoutePath.DASHBOARD;
};

export const stashGoogleAuthError = (message: string) => {
  if (!hasWindow()) {
    return;
  }

  window.sessionStorage.setItem(GOOGLE_AUTH_ERROR_KEY, message);
};

export const consumeGoogleAuthError = (sourcePath: GoogleAuthSourcePath) => {
  if (!hasWindow()) {
    return null;
  }

  const pendingPath = getPendingGoogleAuthPath();
  if (pendingPath !== sourcePath) {
    return null;
  }

  const message =
    window.sessionStorage.getItem(GOOGLE_AUTH_ERROR_KEY) ||
    getGoogleOAuthCallbackError(window.location.href);

  if (!message) {
    return null;
  }

  clearPendingGoogleAuth();
  return message;
};

export const isGoogleOAuthCallbackUrl = (urlString: string) => {
  try {
    return parseAuthParams(urlString).hasAuthParams;
  } catch {
    return false;
  }
};

export const getGoogleOAuthCallbackError = (urlString: string) => {
  try {
    return parseAuthParams(urlString).error;
  } catch {
    return null;
  }
};

export const redirectToAppRoute = (path: string) => {
  if (!hasWindow()) {
    return;
  }

  const targetPath = path === RoutePath.HOME ? '/' : path;
  window.location.replace(`${window.location.origin}${targetPath}`);
};

const launchGoogleOAuth = async () => {
  const isNative = hasWindow() && Capacitor.isNativePlatform();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getGoogleOAuthRedirectTo(),
      ...(isNative ? { skipBrowserRedirect: true } : {}),
    },
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  if (isNative) {
    if (!data.url) {
      return {
        ok: false as const,
        message: 'Google sign in could not be opened. Please try again.',
      };
    }

    const { Browser } = await import('@capacitor/browser');
    await Browser.open({
      url: data.url,
      presentationStyle: 'fullscreen',
    });
  }

  return { ok: true as const };
};

export const startGoogleOAuthFlow = async ({
  sourcePath,
  redirectPath = RoutePath.HOME,
}: {
  sourcePath: GoogleAuthSourcePath;
  redirectPath?: string;
}) => {
  if (isLaunchingOAuth) return null;
  isLaunchingOAuth = true;
  rememberPendingGoogleAuth({ sourcePath, redirectPath });

  try {
    const launchResult = await launchGoogleOAuth();

    if (!launchResult.ok) {
      clearPendingGoogleAuth();
      return launchResult.message;
    }
  } catch (error) {
    clearPendingGoogleAuth();
    return error instanceof Error
      ? error.message
      : 'An unexpected error occurred during Google login.';
  } finally {
    isLaunchingOAuth = false;
  }

  return null;
};

export const consumeNativeGoogleOAuthCallback = async (
  urlString: string,
): Promise<NativeGoogleOAuthResult> => {
  try {
    const { code, error, accessToken, refreshToken, hasAuthParams } = parseAuthParams(urlString);

    if (!hasAuthParams) {
      return { handled: false };
    }

    if (error) {
      return { handled: true, success: false, error };
    }

    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        return { handled: true, success: false, error: exchangeError.message };
      }

      return { handled: true, success: true };
    }

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        return { handled: true, success: false, error: sessionError.message };
      }

      return { handled: true, success: true };
    }

    return {
      handled: true,
      success: false,
      error: 'Google sign in returned without a complete session.',
    };
  } catch {
    return { handled: false };
  }
};
export const signInWithVerifiedEmail = async (assertion: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: assertion,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during Verified Email login.',
    };
  }
};

import { useSyncExternalStore } from 'react';

import { RoutePath } from '../../types';
import {
  AUTH_HINT_STALE_STORAGE_KEY,
  AUTH_HINT_STALE_VALUE,
} from '../config/authHintKeys.js';

type AuthHintStorage = Pick<Storage, 'length' | 'key'>;
type AuthHintStatusStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const AUTH_HINT_CHANGE_EVENT = 'reflections:auth-hint-change';
export const AUTH_HINT_PENDING_CLASS = 'auth-hint-pending';

const emitAuthHintChange = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_HINT_CHANGE_EVENT));
};

const getAuthHintStorage = (): AuthHintStorage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Could not inspect local auth storage.', error);
    return null;
  }
};

const getAuthHintStatusStorage = (): AuthHintStatusStorage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Could not inspect local auth storage.', error);
    return null;
  }
};

const isSupabaseAuthTokenKey = (key: string | null) =>
  key?.startsWith('sb-') && key.endsWith('-auth-token');

export const hasStaleStoredAuthSessionHint = (
  statusStorage: AuthHintStatusStorage | null = getAuthHintStatusStorage(),
): boolean => {
  if (!statusStorage) {
    return false;
  }

  try {
    return statusStorage.getItem(AUTH_HINT_STALE_STORAGE_KEY) === AUTH_HINT_STALE_VALUE;
  } catch (error) {
    console.warn('Could not inspect local auth storage.', error);
    return false;
  }
};

export const hasStoredAuthSessionHint = (
  storage: AuthHintStorage | null = getAuthHintStorage(),
): boolean => {
  if (!storage) {
    return false;
  }

  try {
    for (let index = 0; index < storage.length; index += 1) {
      if (isSupabaseAuthTokenKey(storage.key(index))) {
        return true;
      }
    }
  } catch (error) {
    console.warn('Could not inspect local auth storage.', error);
  }

  return false;
};

export const hasStrongStoredAuthSessionHint = (
  storage: AuthHintStorage | null = getAuthHintStorage(),
  statusStorage: AuthHintStatusStorage | null = getAuthHintStatusStorage(),
): boolean => hasStoredAuthSessionHint(storage) && !hasStaleStoredAuthSessionHint(statusStorage);

export const markStoredAuthSessionHintAsStale = (
  statusStorage: AuthHintStatusStorage | null = getAuthHintStatusStorage(),
): void => {
  if (!statusStorage) {
    return;
  }

  try {
    const wasStale = statusStorage.getItem(AUTH_HINT_STALE_STORAGE_KEY) === AUTH_HINT_STALE_VALUE;
    statusStorage.setItem(AUTH_HINT_STALE_STORAGE_KEY, AUTH_HINT_STALE_VALUE);

    if (!wasStale) {
      emitAuthHintChange();
    }
  } catch (error) {
    console.warn('Could not inspect local auth storage.', error);
  }
};

export const markStoredAuthSessionHintAsVerified = (
  statusStorage: AuthHintStatusStorage | null = getAuthHintStatusStorage(),
): void => {
  if (!statusStorage) {
    return;
  }

  try {
    const hadStaleMarker = statusStorage.getItem(AUTH_HINT_STALE_STORAGE_KEY) !== null;
    statusStorage.removeItem(AUTH_HINT_STALE_STORAGE_KEY);

    if (hadStaleMarker) {
      emitAuthHintChange();
    }
  } catch (error) {
    console.warn('Could not inspect local auth storage.', error);
  }
};

export const syncStoredAuthSessionHintStatus = (
  session: unknown,
  storage: AuthHintStorage | null = getAuthHintStorage(),
  statusStorage: AuthHintStatusStorage | null = getAuthHintStatusStorage(),
): void => {
  const previousPath = getPublicHomePath(storage, statusStorage);

  if (session) {
    markStoredAuthSessionHintAsVerified(statusStorage);
    if (previousPath !== getPublicHomePath(storage, statusStorage)) {
      emitAuthHintChange();
    }
    return;
  }

  if (hasStoredAuthSessionHint(storage)) {
    markStoredAuthSessionHintAsStale(statusStorage);
    if (previousPath !== getPublicHomePath(storage, statusStorage)) {
      emitAuthHintChange();
    }
    return;
  }

  markStoredAuthSessionHintAsVerified(statusStorage);
  if (previousPath !== getPublicHomePath(storage, statusStorage)) {
    emitAuthHintChange();
  }
};

export const getPublicHomePath = (
  storage: AuthHintStorage | null = getAuthHintStorage(),
  statusStorage: AuthHintStatusStorage | null = getAuthHintStatusStorage(),
): RoutePath.HOME | RoutePath.DASHBOARD =>
  hasStrongStoredAuthSessionHint(storage, statusStorage) ? RoutePath.DASHBOARD : RoutePath.HOME;

const subscribeToAuthHintChanges = (onStoreChange: () => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener(AUTH_HINT_CHANGE_EVENT, onStoreChange);
  window.addEventListener('storage', onStoreChange);

  return () => {
    window.removeEventListener(AUTH_HINT_CHANGE_EVENT, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
};

export const usePublicHomePath = (): RoutePath.HOME | RoutePath.DASHBOARD =>
  useSyncExternalStore(
    subscribeToAuthHintChanges,
    () => getPublicHomePath(),
    () => RoutePath.HOME,
  );

export const clearLandingAuthHintPendingClass = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.remove(AUTH_HINT_PENDING_CLASS);
};

export const resolveAuthHintLandingPath = async (
  loadSession: () => Promise<unknown>,
): Promise<{ path: RoutePath.HOME | RoutePath.DASHBOARD; verified: boolean }> => {
  try {
    return (await loadSession())
      ? { path: RoutePath.DASHBOARD, verified: true }
      : { path: RoutePath.HOME, verified: true };
  } catch (error) {
    console.warn('Could not verify the existing auth session from landing.', error);
    return { path: RoutePath.HOME, verified: false };
  }
};

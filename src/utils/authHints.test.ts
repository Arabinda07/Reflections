import { describe, expect, it } from 'vitest';

import { RoutePath } from '../../types';
import {
  AUTH_HINT_CHANGE_EVENT,
  AUTH_HINT_PENDING_CLASS,
  clearLandingAuthHintPendingClass,
  getPublicHomePath,
  hasStaleStoredAuthSessionHint,
  hasStoredAuthSessionHint,
  hasStrongStoredAuthSessionHint,
  markStoredAuthSessionHintAsStale,
  markStoredAuthSessionHintAsVerified,
  resolveAuthHintLandingPath,
  syncStoredAuthSessionHintStatus,
} from './authHints';
import {
  AUTH_HINT_STALE_STORAGE_KEY,
  AUTH_HINT_STALE_VALUE,
} from '../config/authHintKeys.js';

class MockAuthHintStorage {
  private readonly values = new Map<string, string>();

  constructor(private readonly keys: string[]) {}

  get length() {
    return this.keys.length;
  }

  key(index: number) {
    return this.keys[index] ?? null;
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe('auth hint helpers', () => {
  it('detects a stored Supabase auth token key', () => {
    expect(
      hasStoredAuthSessionHint(
        new MockAuthHintStorage([
          'theme',
          'sb-project-ref-auth-token',
        ]),
      ),
    ).toBe(true);
  });

  it('returns false when no Supabase auth token key is present', () => {
    expect(
      hasStoredAuthSessionHint(new MockAuthHintStorage(['theme', 'recent-note'])),
    ).toBe(false);
  });

  it('routes public Home to the dashboard when an auth hint exists', () => {
    expect(
      getPublicHomePath(new MockAuthHintStorage(['sb-project-ref-auth-token'])),
    ).toBe(RoutePath.DASHBOARD);
  });

  it('routes public Home to the landing page when no auth hint exists', () => {
    expect(getPublicHomePath(new MockAuthHintStorage([]))).toBe(RoutePath.HOME);
  });

  it('downgrades public Home back to the landing page when the auth hint is stale', () => {
    const storage = new MockAuthHintStorage(['sb-project-ref-auth-token']);

    markStoredAuthSessionHintAsStale(storage);

    expect(hasStaleStoredAuthSessionHint(storage)).toBe(true);
    expect(hasStrongStoredAuthSessionHint(storage, storage)).toBe(false);
    expect(getPublicHomePath(storage, storage)).toBe(RoutePath.HOME);
  });

  it('clears the stale auth marker once a session is verified again', () => {
    const storage = new MockAuthHintStorage(['sb-project-ref-auth-token']);

    markStoredAuthSessionHintAsStale(storage);
    markStoredAuthSessionHintAsVerified(storage);

    expect(storage.getItem(AUTH_HINT_STALE_STORAGE_KEY)).toBeNull();
  });

  it('marks an orphaned auth token as stale when verification proves there is no session', () => {
    const storage = new MockAuthHintStorage(['sb-project-ref-auth-token']);

    syncStoredAuthSessionHintStatus(null, storage, storage);

    expect(storage.getItem(AUTH_HINT_STALE_STORAGE_KEY)).toBe(AUTH_HINT_STALE_VALUE);
  });

  it('notifies same-tab subscribers when route-level verification updates the hint', () => {
    const previousWindow = globalThis.window;
    const storage = new MockAuthHintStorage(['sb-project-ref-auth-token']);
    const fakeWindow = new EventTarget() as Window & typeof globalThis;
    let changeCount = 0;

    Object.defineProperty(globalThis, 'window', {
      value: fakeWindow,
      configurable: true,
    });

    fakeWindow.addEventListener(AUTH_HINT_CHANGE_EVENT, () => {
      changeCount += 1;
    });

    try {
      syncStoredAuthSessionHintStatus(null, storage, storage);
      expect(changeCount).toBeGreaterThan(0);
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: previousWindow,
        configurable: true,
      });
    }
  });

  it('removes the static first-paint auth gate before rendering stale-hint fallback landing', () => {
    const previousDocument = globalThis.document;
    const removedClasses: string[] = [];

    Object.defineProperty(globalThis, 'document', {
      value: {
        documentElement: {
          classList: {
            remove: (className: string) => removedClasses.push(className),
          },
        },
      },
      configurable: true,
    });

    try {
      clearLandingAuthHintPendingClass();
      expect(removedClasses).toEqual([AUTH_HINT_PENDING_CLASS]);
    } finally {
      Object.defineProperty(globalThis, 'document', {
        value: previousDocument,
        configurable: true,
      });
    }
  });

  it('falls back to the public landing when a hinted session is stale', async () => {
    await expect(resolveAuthHintLandingPath(async () => null)).resolves.toEqual({
      path: RoutePath.HOME,
      verified: true,
    });
  });

  it('falls back to the public landing when session verification throws', async () => {
    await expect(
      resolveAuthHintLandingPath(async () => {
        throw new Error('storage unavailable');
      }),
    ).resolves.toEqual({ path: RoutePath.HOME, verified: false });
  });

  it('routes a verified hinted session to the dashboard', async () => {
    await expect(resolveAuthHintLandingPath(async () => ({ id: 'session' }))).resolves.toEqual({
      path: RoutePath.DASHBOARD,
      verified: true,
    });
  });
});

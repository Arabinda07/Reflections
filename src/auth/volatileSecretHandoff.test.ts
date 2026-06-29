import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearAllVolatileAuthSecrets,
  clearVolatileAuthSecret,
  consumeVolatileAuthSecret,
  hasVolatileAuthSecret,
  storeVolatileAuthSecret,
  VOLATILE_AUTH_SECRET_TTL_MS,
} from './volatileSecretHandoff';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

afterEach(() => {
  clearAllVolatileAuthSecrets();
  vi.useRealTimers();
});

describe('volatile auth secret handoff', () => {
  it('stores and consumes a secret once', () => {
    storeVolatileAuthSecret('account_password_setup', 'fresh-password', 'user-1');

    expect(hasVolatileAuthSecret('account_password_setup', 'user-1')).toBe(true);
    expect(consumeVolatileAuthSecret('account_password_setup', 'user-1')).toBe('fresh-password');
    expect(consumeVolatileAuthSecret('account_password_setup', 'user-1')).toBeNull();
    expect(hasVolatileAuthSecret('account_password_setup', 'user-1')).toBe(false);
  });

  it('rejects cross-user reads and clears the attempted handoff', () => {
    storeVolatileAuthSecret('account_password_setup', 'fresh-password', 'user-1');

    expect(hasVolatileAuthSecret('account_password_setup', 'user-2')).toBe(false);
    expect(consumeVolatileAuthSecret('account_password_setup', 'user-2')).toBeNull();
    expect(hasVolatileAuthSecret('account_password_setup', 'user-1')).toBe(false);
  });

  it('expires only the targeted slot after the ttl', () => {
    vi.useFakeTimers();

    storeVolatileAuthSecret('account_password_setup', 'setup-password', 'user-1');
    storeVolatileAuthSecret('account_password_reset', 'reset-password', 'user-1', VOLATILE_AUTH_SECRET_TTL_MS * 2);

    vi.advanceTimersByTime(VOLATILE_AUTH_SECRET_TTL_MS);

    expect(hasVolatileAuthSecret('account_password_setup', 'user-1')).toBe(false);
    expect(hasVolatileAuthSecret('account_password_reset', 'user-1')).toBe(true);
    expect(consumeVolatileAuthSecret('account_password_reset', 'user-1')).toBe('reset-password');
  });

  it('clears one slot or every slot explicitly', () => {
    storeVolatileAuthSecret('account_password_setup', 'setup-password', 'user-1');
    storeVolatileAuthSecret('account_password_reset', 'reset-password', 'user-1');

    clearVolatileAuthSecret('account_password_setup');

    expect(hasVolatileAuthSecret('account_password_setup', 'user-1')).toBe(false);
    expect(hasVolatileAuthSecret('account_password_reset', 'user-1')).toBe(true);

    clearAllVolatileAuthSecrets();

    expect(hasVolatileAuthSecret('account_password_reset', 'user-1')).toBe(false);
  });

  it('keeps persistent storage and remote persistence out of the primitive', () => {
    const source = read('src/auth/volatileSecretHandoff.ts');

    expect(source).toContain('VOLATILE_AUTH_SECRET_TTL_MS');
    expect(source).toContain('account_password_setup');
    expect(source).toContain('account_password_reset');
    expect(source).not.toContain('localStorage');
    expect(source).not.toContain('indexedDB');
    expect(source).not.toContain('supabase');
  });

  it('keeps product adapters stable and delegated', () => {
    const setupAdapter = read('src/auth/accountPasswordHandoff.ts');
    const resetAdapter = read('features/private-writing-recovery/resetPasswordRecoveryHandoff.ts');

    expect(setupAdapter).toContain('storePendingAccountPassword');
    expect(setupAdapter).toContain('consumePendingAccountPassword');
    expect(setupAdapter).toContain("storeVolatileAuthSecret('account_password_setup'");
    expect(setupAdapter).toContain("consumeVolatileAuthSecret('account_password_setup', userId)");
    expect(setupAdapter).not.toContain('setTimeout');

    expect(resetAdapter).toContain('storePendingResetAccountPassword');
    expect(resetAdapter).toContain('consumePendingResetAccountPassword');
    expect(resetAdapter).toContain("storeVolatileAuthSecret('account_password_reset'");
    expect(resetAdapter).toContain("consumeVolatileAuthSecret('account_password_reset', userId)");
    expect(resetAdapter).not.toContain('setTimeout');
  });

  it('clears handoff secrets on auth boundary changes and Account sign-out paths', () => {
    const bootstrapper = read('hooks/useAuthBootstrapper.ts');
    const account = read('pages/dashboard/Account.tsx');

    expect(bootstrapper).toContain('clearSecretsOnAuthBoundaryChange');
    expect(bootstrapper).toContain('clearAllVolatileAuthSecrets');
    expect(account).toContain('const { user, isAuthenticated, logout } = useAuthStore()');
    expect(account).toContain('await logout()');
    expect(account).not.toContain('await supabase.auth.signOut()');
  });
});

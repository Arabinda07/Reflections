import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('private writing recovery module contract', () => {
  it('stores reset account passwords only in volatile module memory', () => {
    const handoff = read('features/private-writing-recovery/resetPasswordRecoveryHandoff.ts');
    const primitive = read('src/auth/volatileSecretHandoff.ts');

    expect(primitive).toContain('VOLATILE_AUTH_SECRET_TTL_MS');
    expect(primitive).toContain('account_password_reset');
    expect(handoff).toContain('storePendingResetAccountPassword');
    expect(handoff).toContain('consumePendingResetAccountPassword');
    expect(handoff).toContain("storeVolatileAuthSecret('account_password_reset'");
    expect(handoff).not.toContain('localStorage');
    expect(handoff).not.toContain('indexedDB');
    expect(handoff).not.toContain('supabase');
  });

  it('adds a protected non-private-gated recovery route', () => {
    const app = read('App.tsx');
    const types = read('types.ts');

    expect(types).toContain("RECOVER_PRIVATE_WRITING = '/recover-private-writing'");
    expect(app).toContain('RecoverPrivateWriting');
    expect(app).toContain('path={RoutePath.RECOVER_PRIVATE_WRITING}');
    expect(app).toContain('withProtectedRoute(withRouteFallback(<RecoverPrivateWriting />))');
    expect(app).not.toContain('withPrivateRoute(withRouteFallback(<RecoverPrivateWriting />))');
  });

  it('routes account-password reset users into private writing recovery', () => {
    const resetPassword = read('pages/auth/ResetPassword.tsx');

    expect(resetPassword).toContain('storePendingResetAccountPassword(password, user.id)');
    expect(resetPassword).toContain("select('unlock_method')");
    expect(resetPassword).toContain("encryptionRow?.unlock_method === 'account_password'");
    expect(resetPassword).toContain('navigate(RoutePath.RECOVER_PRIVATE_WRITING');
  });

  it('defaults to recovery phrase and keeps previous password as fallback', () => {
    const recovery = read('features/private-writing-recovery/RecoverPrivateWriting.tsx');

    expect(recovery).toContain("useState<RecoveryMode>('recovery_phrase')");
    expect(recovery).toContain('Recovery phrase');
    expect(recovery).toContain('Recommended');
    expect(recovery).toContain('I remember my previous password');
    expect(recovery).toContain('recoverAccountPasswordWithRecoveryKey');
    expect(recovery).toContain('recoverAccountPasswordWithPreviousPassword');
    expect(recovery).toContain('!user?.id || !hasPendingResetAccountPassword(user.id)');
    expect(recovery).toContain('const pendingNewPassword = user?.id ? consumePendingResetAccountPassword(user.id) : null');
    expect(recovery).toContain('setNeedsNewPassword(true)');
    expect(recovery).toContain('if (!pendingNewPassword) await verifyTypedNewPassword(passwordForRewrap)');
    expect(recovery).toContain('Enter your new account password');
    expect(recovery).toContain('clearPendingResetAccountPassword()');
  });
});

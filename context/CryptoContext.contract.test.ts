import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('CryptoContext migration contract', () => {
  it('tracks migration progress and exits migration state on failure', () => {
    const source = read('context/CryptoContext.tsx');

    expect(source).toContain('migrationProgress: MigrationProgress | null');
    expect(source).toContain('setMigrationProgress');
    expect(source).toContain('migrateUserPrivateData(nextSession, setMigrationProgress)');
    expect(source).toContain('Private writing could not finish encrypting existing data');
    expect(source).toContain("setStatus('error')");
  });

  it('exposes account-password recovery rewrap methods', () => {
    const source = read('context/CryptoContext.tsx');

    expect(source).toContain('unlockMethod: UnlockMethod | null');
    expect(source).toContain('unlockMethod: bundle?.unlockMethod ?? pendingBundle?.unlockMethod ?? null');
    expect(source).toContain('keyWrapperPolicy');
    expect(source).toContain('keyWrapperPolicy.mapPersistedBundleRow');
    expect(source).toContain('keyWrapperPolicy.toSetupInsertPayload');
    expect(source).toContain('keyWrapperPolicy.unlockWithPrimarySecret');
    expect(source).toContain('keyWrapperPolicy.unlockWithRecoveryPhrase');
    expect(source).toContain('recoverAccountPasswordWithRecoveryKey');
    expect(source).toContain('recoverAccountPasswordWithPreviousPassword');
    expect(source).toContain('rewrapAccountPasswordWithRecoveryPhrase');
    expect(source).toContain('rewrapAccountPasswordWithPreviousPassword');
    expect(source).not.toContain('account_password_wrapper: accountPasswordWrapper');
    expect(source).not.toContain('last_rewrapped_at: new Date().toISOString()');
  });
});

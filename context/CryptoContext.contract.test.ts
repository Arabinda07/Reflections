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
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(path.resolve(process.cwd(), 'context/CryptoContext.tsx'), 'utf8');

describe('CryptoContext migration state', () => {
  it('skips completed scans and persists completion only after migration succeeds', () => {
    const skip = source.indexOf("migrationState === 'plaintext_cleared'");
    const migrate = source.indexOf('await zeroKnowledgeMigrationService.migrateUserPrivateData');
    const persist = source.indexOf(".update({ migration_state: 'plaintext_cleared' })");

    expect(skip).toBeGreaterThanOrEqual(0);
    expect(migrate).toBeGreaterThan(skip);
    expect(persist).toBeGreaterThan(migrate);
  });

  it('clears the active session when migration or completion persistence fails', () => {
    const failure = source.slice(source.indexOf('} catch (migrationError)'), source.indexOf('const lock'));
    expect(failure).toContain('setCurrentCryptoSession(null)');
    expect(failure).toContain('setSession(null)');
  });
});

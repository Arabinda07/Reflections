import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('PrivateDataGate setup contract', () => {
  it('keeps private-writing setup actions visible and validates before enabling them', () => {
    const source = read('components/auth/PrivateDataGate.tsx');

    expect(source).toContain('bg-green');
    expect(source).toContain('text-on-accent');
    expect(source).toContain('min-h-12 w-full');
    expect(source).toContain('isPassphraseReady');
    expect(source).toContain('isRecoveryKeyConfirmed');
    expect(source).toContain('Type the recovery key exactly to continue.');
    expect(source).toContain('spellCheck={false}');
    expect(source).toContain('autoCapitalize="none"');
    expect(source).toContain('autoCorrect="off"');
  });

  it('shows a dedicated migration panel instead of the generic route loader', () => {
    const source = read('components/auth/PrivateDataGate.tsx');

    expect(source).toContain('const MigrationPanel');
    expect(source).toContain('Encrypting your existing writing');
    expect(source).toContain('Larger accounts can take a little longer');
    expect(source).toContain("if (status === 'migrating') return <MigrationPanel />");
    expect(source).not.toContain("status === 'loading' || status === 'migrating'");
  });
});

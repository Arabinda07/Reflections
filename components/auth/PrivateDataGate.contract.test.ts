import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

const APP_UI_HARD_COLOR_PATTERN = /#[0-9A-Fa-f]{3,8}|rgba?\(|hsla?\(|\bbg-white\b|\btext-white\b|\bborder-white\b|\btext-red-\d{2,3}\b|\bbg-gray-\d{2,3}\b|\btext-gray-\d{2,3}\b|\bborder-gray-\d{2,3}\b/;

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

  it('labels private encryption inputs and announces validation errors accessibly', () => {
    const source = read('components/auth/PrivateDataGate.tsx');

    expect(source).toContain('htmlFor="private-unlock-passphrase"');
    expect(source).toContain('id="private-unlock-passphrase"');
    expect(source).toContain('htmlFor="private-unlock-recovery"');
    expect(source).toContain('id="private-unlock-recovery"');
    expect(source).toContain('htmlFor="private-setup-passphrase"');
    expect(source).toContain('id="private-setup-passphrase"');
    expect(source).toContain('htmlFor="private-setup-confirmation"');
    expect(source).toContain('id="private-setup-confirmation"');
    expect(source).toContain('aria-describedby');
    expect(source).toContain('role="alert"');
  });

  it('uses design tokens instead of hard-coded app UI colors', () => {
    const source = read('components/auth/PrivateDataGate.tsx');

    expect(source).toContain('input-surface');
    expect(source).toContain('text-clay');
    expect(source).not.toMatch(APP_UI_HARD_COLOR_PATTERN);
  });

});

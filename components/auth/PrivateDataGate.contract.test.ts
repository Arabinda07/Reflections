import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

const APP_UI_HARD_COLOR_PATTERN = /#[0-9A-Fa-f]{3,8}|rgba?\(|hsla?\(|\bbg-white\b|\btext-white\b|\bborder-white\b|\btext-red-\d{2,3}\b|\bbg-gray-\d{2,3}\b|\btext-gray-\d{2,3}\b|\bborder-gray-\d{2,3}\b/;

describe('PrivateDataGate contract', () => {
  it('keeps first-time setup out of the gate and delegates it to home onboarding', () => {
    const source = read('components/auth/PrivateDataGate.tsx');

    expect(source).not.toContain('const SetupPanel');
    expect(source).not.toContain('setupEncryption');
    expect(source).not.toContain('confirmRecoveryKey');
    expect(source).not.toContain('private-setup-passphrase');
    expect(source).toContain("if (status === 'setupRequired')");
    expect(source).toContain('location.pathname !== RoutePath.DASHBOARD');
    expect(source).toContain('return <>{children}</>');
  });

  it('shows a dedicated migration panel instead of the generic route loader', () => {
    const source = read('components/auth/PrivateDataGate.tsx');

    expect(source).toContain('const MigrationPanel');
    expect(source).toContain('Encrypting your existing writing');
    expect(source).toContain('Larger accounts can take a little longer');
    expect(source).toContain("if (status === 'migrating') return <MigrationPanel />");
    expect(source).not.toContain("status === 'loading' || status === 'migrating'");
  });

  it('labels private unlock inputs and announces validation errors accessibly', () => {
    const source = read('components/auth/PrivateDataGate.tsx');

    expect(source).toContain('unlockMethod');
    expect(source).toContain("unlockMethod === 'account_password'");
    expect(source).toContain('Account password');
    expect(source).toContain('Private-writing password');
    expect(source).toContain('htmlFor="private-unlock-passphrase"');
    expect(source).toContain('id="private-unlock-passphrase"');
    expect(source).toContain('htmlFor="private-unlock-recovery"');
    expect(source).toContain('id="private-unlock-recovery"');
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

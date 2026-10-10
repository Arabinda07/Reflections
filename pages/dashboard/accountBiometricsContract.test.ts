import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(path.resolve(process.cwd(), 'pages/dashboard/Account.tsx'), 'utf8');

describe('Account biometrics and backup contract', () => {
  it('includes biometric app lock toggle with accessibility switch semantics', () => {
    expect(source).toContain('Require biometrics to unlock');
    expect(source).toContain('role="switch"');
    expect(source).toContain('aria-checked={isBiometricEnabled}');
    expect(source).toContain('handleToggleBiometric');
    expect(source).toContain('nativeBiometric.authenticate');
    expect(source).toContain('appSecuritySettings.setBiometricLockEnabled');
  });

  it('includes Data Ownership & Backups section with JSON and ZIP export options', () => {
    expect(source).toContain('Data Ownership & Backups');
    expect(source).toContain('Export Encrypted Backup (.json)');
    expect(source).toContain('Export Journal Archive (.zip)');
    expect(source).toContain('journalBackupService.exportEncryptedJsonBackup');
    expect(source).toContain('journalBackupService.exportZipArchive');
  });
});

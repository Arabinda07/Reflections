import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const indexSource = readFileSync(new URL('../index.tsx', import.meta.url), 'utf8');

describe('app bootstrap contract', () => {
  it('validates required client env before loading App eagerly', () => {
    expect(indexSource).toContain("getMissingClientEnvNames");
    expect(indexSource).toContain("await import('./App')");
    expect(indexSource).not.toContain("import App from './App'");
  });

  it('self-heals stale app-shell caches when a hashed dynamic import disappears', () => {
    expect(indexSource).toContain('recoverFromStaleAppShell');
    expect(indexSource).toContain("navigator.serviceWorker.getRegistrations()");
    expect(indexSource).toContain('registration.unregister()');
    expect(indexSource).toContain('caches.keys()');
    expect(indexSource).toContain('caches.delete(cacheName)');
    expect(indexSource).toContain("const STALE_APP_SHELL_RECOVERY_KEY = 'app_recovered_from_import_error'");
    expect(indexSource).toContain("sessionStorage.setItem(STALE_APP_SHELL_RECOVERY_KEY, 'true')");
    expect(indexSource).toContain('window.location.replace');
    expect(indexSource).not.toContain('Please clear your browser cache or try opening the app in an incognito window');
  });
});

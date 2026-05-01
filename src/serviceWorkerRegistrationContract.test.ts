import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const htmlSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const viteConfigSource = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');

describe('service worker registration contract', () => {
  it('lets vite-plugin-pwa own service worker registration', () => {
    expect(htmlSource).not.toContain("navigator.serviceWorker.register('/sw.js'");
  });

  it('does not race mobile navigations back to stale cached HTML during deploys', () => {
    expect(viteConfigSource).toContain('cleanupOutdatedCaches: true');
    expect(viteConfigSource).not.toContain("cacheName: 'app-navigation'");
    expect(viteConfigSource).not.toContain('networkTimeoutSeconds');
  });
});

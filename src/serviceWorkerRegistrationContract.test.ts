import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const htmlSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('service worker registration contract', () => {
  it('lets vite-plugin-pwa own service worker registration', () => {
    expect(htmlSource).not.toContain("navigator.serviceWorker.register('/sw.js'");
  });
});

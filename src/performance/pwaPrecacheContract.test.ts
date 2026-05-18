import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('lean PWA precache contract', () => {
  it('keeps the install-time precache scoped to the public app shell', () => {
    const viteConfig = read('vite.config.ts');

    expect(viteConfig).toContain('const leanPrecacheAllowlist = [');
    expect(viteConfig).toContain('keepLeanPrecacheEntry');
    expect(viteConfig).toContain('manifestTransforms');
    expect(viteConfig).toContain('entries.filter((entry) => keepLeanPrecacheEntry(entry.url))');
    expect(viteConfig).toContain('maximumFileSizeToCacheInBytes: 2 * 1024 * 1024');
    expect(viteConfig).toContain('app-route-chunks');

    for (const publicShellPattern of [
      'index|App|vendor-core|vendor-routing|vendor-react',
      'AboutArabinda|FAQ|PrivacyPolicy|PublicPageIcon',
      'assets\\/fonts\\/[^/]+\\.woff2',
      'landing_video|landing_video_mobile|sanctuary',
      'og-social|founder',
    ]) {
      expect(viteConfig).toContain(publicShellPattern);
    }
  });

  it('does not precache heavy route, analytics, observability, icon, or media payloads', () => {
    const viteConfig = read('vite.config.ts');

    for (const excluded of [
      '**/vendor-lottie-*.js',
      '**/vendor-analytics-*.js',
      '**/vendor-sentry-*.js',
      '**/*.mp4',
      '**/*.webm',
    ]) {
      expect(viteConfig).toContain(excluded);
    }

    expect(viteConfig).not.toContain("return 'vendor-icons'");
    expect(viteConfig).toContain("if (id.includes('@phosphor-icons')) return undefined;");
    expect(viteConfig).not.toContain('icon-1024.png');
    expect(viteConfig).not.toContain('landing_video.webm');
    expect(viteConfig).not.toContain('landing_video_mobile.webm');
    expect(viteConfig).not.toContain('landing_video_mobile.mp4');
  });
});

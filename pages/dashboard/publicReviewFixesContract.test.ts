import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

const backdropBlurValues = (css: string) =>
  Array.from(css.matchAll(/backdrop-filter:\s*blur\((\d+)px\)/g), ([, value]) => Number(value));

describe('public review fixes contract', () => {
  it('keeps landing footer links out of the focus order and visible footer links touch-safe', () => {
    const shell = read('layouts/PublicAppShell.tsx');
    const footer = read('components/ui/PublicFooter.tsx');

    expect(shell).toContain('{!isLandingRoute && <PublicFooter />}');
    expect(shell).not.toContain('sr-only');
    expect(footer).toContain('min-h-11');
    expect(footer).toContain('inline-flex');
  });

  it('redirects guessed dashboard URLs to the canonical authenticated home route', () => {
    const app = read('App.tsx');
    const types = read('types.ts');
    const vercel = JSON.parse(read('vercel.json')) as {
      rewrites: Array<{ source: string; destination: string }>;
    };

    expect(types).toContain("DASHBOARD_ALIAS = '/dashboard'");
    expect(app).toContain('path={RoutePath.DASHBOARD_ALIAS} element={<Navigate to={RoutePath.DASHBOARD} replace />}');
    expect(vercel.rewrites).toContainEqual({ source: '/dashboard', destination: '/index.html' });
  });

  it('breaks public FAQ and privacy pages out of repeated equal-card grids', () => {
    const faq = read('pages/dashboard/FAQ.tsx');
    const privacy = read('pages/dashboard/PrivacyPolicy.tsx');

    expect(faq).toContain('faq-editorial-lead');
    expect(faq).toContain('faq-compact-list');
    expect(faq).toContain('faq-comparison-band');
    expect(privacy).toContain('privacy-editorial-lead');
    expect(privacy).toContain('privacy-compact-list');
    expect(privacy).toContain('privacy-comparison-band');

    for (const [file, source] of [
      ['FAQ.tsx', faq],
      ['PrivacyPolicy.tsx', privacy],
    ] as const) {
      expect(source, file).not.toContain('transition-all');
    }
  });

  it('caps backdrop blur and avoids long-lived backdrop-filter layers', () => {
    const css = read('index.css');
    const maxBlur = Math.max(...backdropBlurValues(css));

    expect(maxBlur).toBeLessThanOrEqual(16);
    expect(css).not.toContain('will-change: backdrop-filter');
  });

  it('keeps heavyweight public media out of the default shipped asset budget', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const sanctuaryAnimation = read('src/lottie/sanctuaryAnimation.ts');
    const packagedAnimationPath = path.resolve(
      process.cwd(),
      'public/assets/lottie/level-up-animation.lottie',
    );

    expect(landing).not.toContain('landing_video.mp4');
    expect(existsSync(path.resolve(process.cwd(), 'public/assets/videos/landing_video.mp4'))).toBe(false);
    expect(sanctuaryAnimation).toContain('/assets/lottie/level-up-animation.lottie');
    expect(sanctuaryAnimation).not.toContain('level-up-animation.json');
    expect(existsSync(packagedAnimationPath)).toBe(true);
    expect(statSync(packagedAnimationPath).size).toBeLessThan(360 * 1024);
  });
});

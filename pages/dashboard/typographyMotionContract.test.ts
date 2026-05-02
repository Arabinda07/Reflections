import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

const collectSourceFiles = (directory: string): string[] =>
  readdirSync(join(process.cwd(), directory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;

    if (entry.isDirectory()) {
      return collectSourceFiles(path);
    }

    return /\.(tsx|ts|css)$/.test(entry.name) && !entry.name.includes('.test.')
      ? [path]
      : [];
  });

describe('Typography and motion contract', () => {
  it('keeps the app font system explicit and shared across surfaces', () => {
    const indexCss = read('index.css');
    const indexHtml = read('index.html');
    const tailwindConfig = read('tailwind.config.js');
    const completionCardService = read('services/completionCardService.ts');

    expect(indexCss).toContain("--font-sans: 'Manrope'");
    expect(indexCss).toContain("--font-serif: 'Newsreader'");
    expect(indexCss).toContain("--font-display: 'Manrope'");
    expect(indexCss).toContain('font-family: var(--font-sans)');
    expect(indexCss).toContain("url('/assets/fonts/Manrope-Variable.woff2')");
    expect(indexCss).toContain("url('/assets/fonts/Newsreader16pt-Regular.woff2')");
    expect(indexCss).toContain("url('/assets/fonts/Newsreader16pt-Italic.woff2')");
    expect(indexHtml).toContain('/assets/fonts/Manrope-Variable.woff2');
    expect(indexHtml).toContain('/assets/fonts/Newsreader16pt-Regular.woff2');
    expect(indexHtml).toContain('/assets/fonts/Newsreader16pt-Italic.woff2');
    expect(tailwindConfig).toContain('serif: [\'"Newsreader"\', \'serif\']');
    expect(tailwindConfig).toContain('display: [\'"Manrope"\', \'sans-serif\']');
    expect([indexCss, indexHtml, tailwindConfig, completionCardService].join('\n')).not.toMatch(
      /Spectral|Nunito|Manrope\[wght\]/,
    );
    expect(indexCss).not.toContain("font-family: 'Geist', sans-serif");
    expect(indexCss).not.toContain("font-family: 'Feather Bold'");
  });

  it('does not use negative tracking for page or component typography', () => {
    const sourceFiles = [
      'App.tsx',
      'index.css',
      'tailwind.config.js',
      ...collectSourceFiles('pages'),
      ...collectSourceFiles('components'),
      ...collectSourceFiles('layouts'),
    ];

    sourceFiles.forEach((file) => {
      const source = read(file);

      expect(source, file).not.toMatch(/tracking-\[-|tracking-tight\b|tracking-tighter\b/);
      expect(source, file).not.toMatch(/letter-spacing:\s*-/);
      expect(source, file).not.toMatch(/letterSpacing:\s*['"]-/);
    });
  });

  it('keeps motion reduced-motion safe across CSS and Motion components', () => {
    const app = read('App.tsx');
    const indexCss = read('index.css');
    const home = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(app).toContain('<MotionConfig reducedMotion="user">');
    expect(indexCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(indexCss).toContain('animation-duration: 0.01ms !important');
    expect(home).toContain('if (shouldReduceMotion)');
  });

  it('keeps the Sanctuary entry animation unframed and full-screen', () => {
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(lifeWiki).toContain('pointer-events-none absolute inset-0 z-0');
    expect(lifeWiki).toContain('mix-blend-luminosity');
    expect(lifeWiki).not.toContain('h-32 w-32 overflow-hidden rounded-[var(--radius-panel)] bg-green/5');
  });
});

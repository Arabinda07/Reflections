import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

const collectFiles = (directory: string, pattern: RegExp): string[] =>
  readdirSync(join(process.cwd(), directory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;

    if (entry.isDirectory()) {
      return collectFiles(path, pattern);
    }

    return pattern.test(entry.name) && !entry.name.includes('.test.') ? [path] : [];
  });

const collectSourceFiles = (directory: string): string[] => collectFiles(directory, /\.(tsx|ts|css)$/);

describe('Typography and motion contract', () => {
  it('keeps the app font system explicit and shared across surfaces', () => {
    const indexCss = read('index.css');
    const indexHtml = read('index.html');
    const tailwindConfig = read('tailwind.config.js');
    const completionCardService = read('services/completionCardService.ts');

    expect(indexCss).toContain("--font-sans: 'Manrope'");
    expect(indexCss).toContain("--font-serif: 'Spectral'");
    expect(indexCss).toContain("--font-display: 'Manrope'");
    expect(indexCss).toContain('font-family: var(--font-sans)');
    expect(indexCss).toContain("url('/assets/fonts/Manrope-Variable.woff2')");
    expect(indexCss).toContain("url('/assets/fonts/Spectral-Regular.woff2')");
    expect(indexCss).toContain("url('/assets/fonts/Spectral-Italic.woff2')");
    expect(indexHtml).toContain('/assets/fonts/Manrope-Variable.woff2');
    expect(indexHtml).toContain('/assets/fonts/Spectral-Regular.woff2');
    expect(indexHtml).toContain('/assets/fonts/Spectral-Italic.woff2');
    expect(tailwindConfig).toContain('serif: [\'"Spectral"\', \'serif\']');
    expect(tailwindConfig).toContain('display: [\'"Manrope"\', \'sans-serif\']');
    expect([indexCss, indexHtml, tailwindConfig, completionCardService].join('\n')).not.toMatch(
      /Newsreader|Nunito|Manrope\[wght\]/,
    );
    expect(indexCss).not.toContain("font-family: 'Geist', sans-serif");
    expect(indexCss).not.toContain("font-family: 'Feather Bold'");
  });

  it('ships only the font files used by the current app typography system', () => {
    const fontFiles = readdirSync(join(process.cwd(), 'public/assets/fonts')).sort();

    expect(fontFiles).toEqual([
      'GeistMono[wght].woff2',
      'Manrope-Variable.woff2',
      'Spectral-Bold.woff2',
      'Spectral-Italic.woff2',
      'Spectral-Regular.woff2',
    ]);
  });

  it('keeps the Android bundle synced to the web font system', () => {
    const androidPublicBundle = 'android/app/src/main/assets/public';

    if (!existsSync(join(process.cwd(), androidPublicBundle))) {
      return;
    }

    const androidFiles = collectFiles(androidPublicBundle, /\.(css|html|js)$/);
    const androidBundle = androidFiles.map(read).join('\n');

    expect(androidBundle).toContain('Spectral');
    expect(androidBundle).toContain('Manrope');
    expect(androidBundle).toContain('Geist Mono');
    expect(androidBundle).not.toMatch(/Newsreader|Nunito|Sora|sora|Geist\[wght\]/);
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

  it('keeps dashboard motion off broad and layout-property animations', () => {
    const auditedMotionFiles = [
      'pages/dashboard/HomeAuthenticated.tsx',
      'pages/dashboard/Insights.tsx',
      'pages/dashboard/LifeWiki.tsx',
      'components/ui/AmbientMusicButton.tsx',
    ];

    auditedMotionFiles.forEach((file) => {
      const source = read(file);

      expect(source, file).not.toContain('transition-all');
      expect(source, file).not.toMatch(/(?:initial|animate|exit)=\{\{\s*height:/);
      expect(source, file).not.toMatch(/(?:initial|animate|exit)=\{\{\s*width:/);
    });

    const insights = read('pages/dashboard/Insights.tsx');
    const ambientButton = read('components/ui/AmbientMusicButton.tsx');

    expect(insights).toContain("gridTemplateRows: '1fr'");
    expect(insights).toContain('scaleX: percent / 100');
    expect(ambientButton).toContain('scaleY: bar.h.map');
  });

  it('keeps the Sanctuary entry animation unframed and full-screen', () => {
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(lifeWiki).toContain('pointer-events-none absolute inset-0 z-0 flex items-center justify-center');
    expect(lifeWiki).toContain('SANCTUARY_LEVEL_UP_ANIMATION_SRC');
    expect(lifeWiki).not.toContain('h-32 w-32 overflow-hidden rounded-[var(--radius-panel)] bg-green/5');
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('core app typography and layout contract', () => {
  it('defines shared readable measures, rhythm, and dashboard type roles', () => {
    const css = read('index.css');

    expect(css).toContain('--measure-readable: 65ch;');
    expect(css).toContain('--measure-compact: 52ch;');
    expect(css).toContain('--measure-wide: 75ch;');
    expect(css).toContain('--tracking-caps: 0.16em;');
    expect(css).toContain('.core-page-stack');
    expect(css).toContain('.core-section-stack');
    expect(css).toContain('.typographic-measure');
    expect(css).toContain('.editor-writing-measure');
    expect(css).toContain('.dashboard-prose');
    expect(css).toContain('.dashboard-stat-value');
  });

  it('uses the shared rhythm and measure primitives on the signed-in core pages', () => {
    const pages = {
      home: read('pages/dashboard/HomeAuthenticated.tsx'),
      notes: read('pages/dashboard/MyNotes.tsx'),
      createNote: read('pages/dashboard/CreateNote.tsx'),
      singleNote: read('pages/dashboard/SingleNote.tsx'),
      insights: read('pages/dashboard/Insights.tsx'),
      lifeWiki: read('pages/dashboard/LifeWiki.tsx'),
      futureLetters: read('pages/dashboard/FutureLetters.tsx'),
      account: read('pages/dashboard/Account.tsx'),
      release: read('pages/dashboard/ReleaseMode.tsx'),
    };

    expect(pages.home).toContain('core-bento-grid');
    expect(pages.home).toContain('dashboard-prompt-text typographic-measure');
    expect(pages.notes).toContain('core-page-stack');
    expect(pages.createNote).toContain('editor-writing-measure');
    expect(pages.createNote).toContain('editor-title-input');
    expect(pages.singleNote).toContain('dashboard-prose');
    expect(pages.insights).toContain('core-page-stack');
    expect(pages.insights).toContain('dashboard-stat-value');
    expect(pages.lifeWiki).toContain('core-page-stack');
    expect(pages.lifeWiki).toContain('dashboard-prose');
    expect(pages.futureLetters).toContain('core-page-stack');
    expect(pages.account).toContain('core-page-stack');
    expect(pages.release).toContain('release-writing-measure');
  });

  it('keeps the home audio control away from the mobile primary CTA path', () => {
    const audioCss = read('components/ui/ambient-music.css');
    const home = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(audioCss).toContain('@media (max-width: 640px)');
    expect(audioCss).toContain('position: absolute;');
    expect(audioCss).toContain('bottom: clamp(1rem, 4dvh, 2rem);');
    expect(audioCss).toContain('z-index: 30;');
    expect(audioCss).toContain('.floating-audio-container .audio-hint');
    expect(audioCss).toContain('display: none;');
    const audioPosition = home.indexOf('<div className="floating-audio-container">');
    const cardsPosition = home.indexOf('className="core-bento-grid"');

    expect(audioPosition).toBeGreaterThan(-1);
    expect(cardsPosition).toBeGreaterThan(-1);
    expect(audioPosition).toBeLessThan(cardsPosition);
  });
});

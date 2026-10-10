import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('adapt and distill source contract', () => {
  it('keeps the requested mobile support controls touch-safe', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const signIn = read('pages/auth/SignIn.tsx');
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const myNotes = read('pages/dashboard/MyNotes.tsx');
    const button = read('components/ui/Button.tsx');

    expect(landing).toContain('min-h-11');
    expect(signIn).toContain('min-h-11');
    expect(home).toContain('h-11 min-w-11');
    expect(button).toContain('sm: "min-h-11 px-3 py-2');
    expect(myNotes).toContain('control-surface inline-flex h-11 w-11');
    expect(myNotes).toContain('flex min-h-11 w-full items-center');
    expect(createNote).toContain('inline-flex min-h-11 items-center gap-2 whitespace-nowrap');
  });

  it('removes repeated grain overlays and flattens the FAQ guide', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const layout = read('layouts/DashboardLayout.tsx');
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const faq = read('pages/dashboard/FAQ.tsx');
    const css = read('index.css');

    expect(landing).not.toContain('grain-overlay');
    expect(layout).not.toContain('grain-overlay');
    expect(createNote).not.toContain('grain-overlay');
    expect(createNote).toContain('editor-title-input');
    expect(home).toContain('home-hero-shell relative isolate');
    expect(css).toContain('--home-hero-intro-height: max(300px, 44dvh);');
    expect(faq).toContain('PublicPageSection');
    expect(css).toContain('@media (max-width: 768px)');
    expect(css).toContain('background-attachment: scroll');
    expect(faq).not.toContain('bezel-outer group');
    expect(faq).not.toContain('border-l border-border');
    expect(faq).not.toContain('Plain answers');
  });

  it('keeps the Pro upgrade surface quiet after distill', () => {
    const proUpgrade = read('components/ui/ProUpgradeCTA.tsx');

    expect(proUpgrade).not.toContain('cycling.mp4');
    expect(proUpgrade).toContain('More room when life gets loud');
    expect(proUpgrade).toContain('No surprise charges. No guilt trip. Cancel anytime.');
  });
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('remaining roadmap contract', () => {
  it('keeps the shell and metadata aligned to the writing-first Reflections contract', () => {
    const dashboardLayout = read('layouts/DashboardLayout.tsx');
    const viteConfig = read('vite.config.ts');
    const account = read('pages/dashboard/Account.tsx');
    const insights = read('pages/dashboard/Insights.tsx');
    const notFound = read('pages/NotFound.tsx');

    expect(dashboardLayout).toContain('Skip to content');
    expect(dashboardLayout).toContain('id="main-content"');

    expect(viteConfig).not.toContain('Mindful Notes');
    expect(viteConfig).not.toContain('AI-powered');

    expect(account).not.toContain('Your sanctuary settings');
    expect(account).not.toContain('Your sanctuary now carries your new avatar.');
    expect(insights).not.toContain('Your sanctuary is ready when your first reflection arrives.');
    expect(notFound).not.toContain('head back to the sanctuary');
  });

  it('keeps intentional loading and feedback surfaces on the current lottie path', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const loadingState = read('components/ui/LoadingState.tsx');
    const paperPlaneToast = read('components/ui/PaperPlaneToast.tsx');
    const companionObservation = read('components/ui/CompanionObservation.tsx');
    const notFound = read('pages/NotFound.tsx');
    const myNotes = read('pages/dashboard/MyNotes.tsx');
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(createNote).toContain('DotLottieReact');
    expect(createNote).toContain("from '@/src/lottie/trail-loading.json'");

    expect(loadingState).toContain("from './OverlayFeedback'");
    expect(loadingState).toContain('DotLottieReact');
    expect(loadingState).toContain('loadingAnimation');
    expect(paperPlaneToast).toContain('DotLottieReact');
    expect(companionObservation).toContain('DotLottieReact');
    expect(notFound).toContain('DotLottieReact');
    expect(notFound).toContain('/assets/lottie/Error 404.json');
    expect(myNotes).toContain('/assets/lottie/empty notes.json');
    expect(lifeWiki).toContain('/assets/lottie/Level Up Animation.json');
  });

  it('keeps the library page on the shared loader and lazy calendar path', () => {
    const myNotes = read('pages/dashboard/MyNotes.tsx');

    expect(myNotes).toContain('<LoadingState');
    expect(myNotes).not.toContain('isContentVisible');
    expect(myNotes).toContain('buildNotePreviewText');
    expect(myNotes).toContain("import('./MyNotesCalendar')");
  });
});

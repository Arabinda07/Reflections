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

  it('removes staged delays and heavy inline lottie usage from the remaining hot paths', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const loadingState = read('components/ui/LoadingState.tsx');
    const paperPlaneToast = read('components/ui/PaperPlaneToast.tsx');
    const companionObservation = read('components/ui/CompanionObservation.tsx');
    const notFound = read('pages/NotFound.tsx');

    expect(createNote).not.toContain('3200');
    expect(createNote).not.toContain('5000');
    expect(createNote).not.toContain('visualFloor');
    expect(createNote).not.toContain('nuclearTimer');
    expect(createNote).not.toContain('DotLottieReact');

    expect(loadingState).not.toContain('DotLottieReact');
    expect(paperPlaneToast).not.toContain('DotLottieReact');
    expect(companionObservation).not.toContain('DotLottieReact');
    expect(notFound).not.toContain('DotLottieReact');
  });

  it('simplifies the remaining drift-heavy library page state', () => {
    const myNotes = read('pages/dashboard/MyNotes.tsx');

    expect(myNotes).not.toContain('isContentVisible');
  });
});

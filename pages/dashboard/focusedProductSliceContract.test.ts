import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('focused product slice source contract', () => {
  it('waits for web auth hydration before showing the public landing page', () => {
    const home = read('pages/dashboard/Home.tsx');

    expect(home).toContain('isInitialCheckDone');
    expect(home).toContain('if (!isInitialCheckDone)');
    expect(home).toContain('<HomeFallback />');
  });

  it('makes the home intentions panel a visible task summary', () => {
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(homeAuthenticated).toContain('Task summary');
    expect(homeAuthenticated).toContain('{intentionSummary.openCount}');
    expect(homeAuthenticated).toContain(
      "open {intentionSummary.openCount === 1 ? 'task' : 'tasks'}",
    );
  });

  it('keeps the landing media control touch-safe on mobile', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).toContain('pb-[calc(env(safe-area-inset-bottom)+1.75rem)]');
    expect(landing).toContain('surface-floating--media');
    expect(landing).toContain('min-h-11');
  });

  it('keeps note cards semantic and export-capable without nested card clicks', () => {
    const myNotes = read('pages/dashboard/MyNotes.tsx');

    expect(myNotes).toContain("import { Link");
    expect(myNotes).toContain('<article');
    expect(myNotes).toContain('to={noteDetailPath}');
    expect(myNotes).not.toContain('onClick={() => navigate(RoutePath.NOTE_DETAIL');
    expect(myNotes).toContain('<NoteExportDialog');
    expect(myNotes).toContain('aria-label={`Export ${note.title}`}');
  });

  it('keeps the single-note page wired to the shared export dialog', () => {
    const singleNote = read('pages/dashboard/SingleNote.tsx');

    expect(singleNote).toContain('<NoteExportDialog');
    expect(singleNote).toContain('setIsExportOpen(true)');
    expect(singleNote).toContain('aria-label="Export this reflection"');
  });

  it('keeps the daily focus card labels while removing poetic styling from prompts', () => {
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(homeAuthenticated).toContain('Daily Focus');
    expect(homeAuthenticated).toContain('Start Reflection');
    
    // Check for the specific combination of classes that was removed from the prompt
    expect(homeAuthenticated).toContain('text-2xl md:text-3xl text-gray-text font-serif italic leading-relaxed');
  });

  it('includes Android Verified Email logic in auth pages', () => {
    const signIn = read('pages/auth/SignIn.tsx');
    const signUp = read('pages/auth/SignUp.tsx');

    expect(signIn).toContain('isVerifiedEmailAvailable()');
    expect(signIn).toContain('requestVerifiedEmail()');
    expect(signIn).toContain('Continue with Verified Email');

    expect(signUp).toContain('isVerifiedEmailAvailable()');
    expect(signUp).toContain('requestVerifiedEmail()');
    expect(signUp).toContain('Continue with Verified Email');
  });
});

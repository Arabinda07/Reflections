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
    expect(home).toContain('<RouteLoadingFrame />');
    expect(home).not.toContain('<HomeFallback />');
  });

  it('makes the home intentions panel visible without reverting to old task-summary copy', () => {
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(homeAuthenticated).toContain('Your Intentions');
    expect(homeAuthenticated).toContain('No intentions yet');
    expect(homeAuthenticated).not.toContain('Task summary');
    expect(homeAuthenticated).not.toContain('All settled');
    expect(homeAuthenticated).toContain('{intentionSummary.openCount}');
    expect(homeAuthenticated).toContain('{intentionSummary.openCount} open');
    expect(homeAuthenticated).toContain('intentionSummary.items.slice(0, 3).map');
  });

  it('keeps the landing media control touch-safe on mobile', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).toContain('pb-[calc(env(safe-area-inset-bottom)+1.75rem)]');
    expect(landing).toContain('surface-floating--media');
    expect(landing).toContain('min-h-11');
    expect(landing).not.toContain('max-lg:hidden');
    expect(landing).not.toContain("if (!window.matchMedia('(min-width: 1024px)').matches) return;");
  });

  it('keeps note cards semantic and directly export-capable without nested card clicks', () => {
    const myNotes = read('pages/dashboard/MyNotes.tsx');

    expect(myNotes).toContain("import { Link");
    expect(myNotes).toContain("import { downloadNoteExport } from './noteExport';");
    expect(myNotes).toContain('<article');
    expect(myNotes).toContain('to={noteDetailPath}');
    expect(myNotes).not.toContain('onClick={() => navigate(RoutePath.NOTE_DETAIL');
    expect(myNotes).not.toContain('<NoteExportDialog');
    expect(myNotes).toContain("downloadNoteExport(note, 'md');");
    expect(myNotes).toContain('aria-label={`Export ${note.title}`}');
  });

  it('keeps the single-note page wired to direct markdown export', () => {
    const singleNote = read('pages/dashboard/SingleNote.tsx');

    expect(singleNote).toContain("import { downloadNoteExport } from './noteExport';");
    expect(singleNote).not.toContain('<NoteExportDialog');
    expect(singleNote).not.toContain('setIsExportOpen(true)');
    expect(singleNote).toContain("onClick={() => downloadNoteExport(note, 'md')}");
    expect(singleNote).toContain('aria-label="Export this reflection"');
  });

  it('keeps the home dashboard organized around the primary writing action', () => {
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(homeAuthenticated).toContain("Today's Reflection");
    expect(homeAuthenticated).toContain('Begin Writing');
    expect(homeAuthenticated).toContain('Quick check-in');
    expect(homeAuthenticated).toContain('Future letter');
    expect(homeAuthenticated).toContain('Your Rhythm');
    expect(homeAuthenticated).toContain('Before you write');
    expect(homeAuthenticated).toContain('lg:grid-cols-[minmax(0,2fr)_minmax(20rem,0.95fr)]');
    expect(homeAuthenticated).not.toContain('Daily Focus');
    expect(homeAuthenticated).not.toContain('Start Reflection');
    expect(homeAuthenticated).not.toContain('Reflections Overview');
    expect(homeAuthenticated).not.toContain('Writing note');
    expect(homeAuthenticated).not.toContain('lg:grid-cols-3');
    
    // Check for the specific combination of classes that was removed from the prompt
    expect(homeAuthenticated).toContain('text-2xl md:text-3xl text-gray-text font-serif italic leading-relaxed');
  });

  it('removes quietly from live app and AI copy', () => {
    const liveCopyFiles = [
      'pages/dashboard/AboutArabinda.tsx',
      'pages/dashboard/FutureLetters.tsx',
      'pages/dashboard/Account.tsx',
      'api/ai.ts',
    ];

    liveCopyFiles.forEach((filePath) => {
      expect(read(filePath).toLowerCase()).not.toContain('quietly');
    });
    expect(read('pages/dashboard/FutureLetters.tsx')).toContain('Waiting to open');
    expect(read('pages/dashboard/Account.tsx')).toContain('while Smart Mode is on');
    expect(read('api/ai.ts')).toContain('calm, and reflective');
  });

  it('adds standalone mood check-ins without turning moods into scores', () => {
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(homeAuthenticated).toContain('moodCheckinService.create');
    expect(homeAuthenticated).toContain('Quick check-in');
    expect(homeAuthenticated).toContain('MOOD_OPTIONS.map');
    expect(read('pages/dashboard/moodConfig.ts')).toContain("['happy', 'calm', 'anxious', 'sad', 'angry', 'tired']");
    expect(homeAuthenticated.toLowerCase()).not.toContain('score');

    expect(createNote).toContain('title="Mood"');
    expect(createNote).not.toContain('Reflection mood');
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

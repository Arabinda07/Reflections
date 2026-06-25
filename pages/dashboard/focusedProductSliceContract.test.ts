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
    expect(homeAuthenticated).toContain('Set your first intention');
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

  it('gives the My Notes tag filters context without changing URL filtering', () => {
    const myNotes = read('pages/dashboard/MyNotes.tsx');
    const chip = read('components/ui/Chip.tsx');
    const styles = read('index.css');

    expect(myNotes).toContain('tag-filter-shelf');
    expect(myNotes).toContain('tag-filter-chip-rail');
    expect(myNotes).toContain('Filter by tag');
    expect(myNotes).toContain('tagSummaries');
    expect(myNotes).toContain('countLabel');
    expect(myNotes).toContain('navigate(`${RoutePath.NOTES}?tag=${encodeURIComponent(tag.name)}`)');
    expect(myNotes).toContain('Showing reflections tagged');
    expect(myNotes).toContain('Clear filter');
    expect(myNotes).toContain("description=\"Cards or calendar");
    expect(chip).toContain('chip-filter-label');
    expect(styles).toContain('.chip-filter-label');
    expect(styles).toContain('text-overflow: ellipsis');
    expect(styles).toContain('.tag-filter-chip-rail');
    expect(styles).toContain('scrollbar-width: none');
  });

  it('keeps the single-note page wired to direct markdown export', () => {
    const singleNote = read('pages/dashboard/SingleNote.tsx');

    expect(singleNote).toContain("import { downloadNoteExport } from './noteExport';");
    expect(singleNote).not.toContain('<NoteExportDialog');
    expect(singleNote).not.toContain('setIsExportOpen(true)');
    expect(singleNote).toContain('handleExportClick');
    expect(singleNote).toContain('aria-label="Export this reflection"');
  });

  it('offers attachment downloads from the single-note export sheet without adding download-all', () => {
    const singleNote = read('pages/dashboard/SingleNote.tsx');

    expect(singleNote).toContain('isExportSheetOpen');
    expect(singleNote).toContain('setIsExportSheetOpen');
    expect(singleNote).toContain('hasAttachments');
    expect(singleNote).toContain("downloadNoteExport(note, 'md')");
    expect(singleNote).toContain('Download Markdown');
    expect(singleNote).toContain('Choose an attachment to download');
    expect(singleNote).toContain('noteAttachments.map');
    expect(singleNote).toContain('downloadAttachment(attachment)');
    expect(singleNote).toContain('link.download = attachment.name');
    expect(singleNote).toContain('aria-label={`Download attachment: ${attachment.name}`}');
    expect(singleNote).not.toContain('Download all');
    expect(singleNote).not.toContain('downloadAllAttachments');
  });

  it('keeps the home dashboard organized around the primary writing action', () => {
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(homeAuthenticated).toContain("Today's Reflection");
    expect(homeAuthenticated).toContain('Begin Writing');
    expect(homeAuthenticated).toContain('Speak a note');
    expect(homeAuthenticated).toContain('Quick check-in');
    expect(homeAuthenticated).toContain('Future letter');
    expect(homeAuthenticated).toContain('Your Rhythm');
    expect(homeAuthenticated).toContain('core-bento-grid');
    expect(homeAuthenticated).toContain('home-primary-action-row');
    expect(homeAuthenticated).toContain('home-secondary-action-row');
    expect(homeAuthenticated).toContain('stopOnFinalTranscript');
    expect(homeAuthenticated).not.toContain('Daily Focus');
    expect(homeAuthenticated).not.toContain('Start Reflection');
    expect(homeAuthenticated).not.toContain('Reflections Overview');
    expect(homeAuthenticated).not.toContain('Writing note');
    expect(homeAuthenticated).not.toContain('lg:grid-cols-3');
    
    // Check for the specific combination of classes that was removed from the prompt
    expect(homeAuthenticated).toContain('dashboard-prompt-text typographic-measure');
  });

  it('lets the authenticated greeting auto-dismiss into the dashboard', () => {
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(homeAuthenticated).toContain('HOME_HERO_INTRO_DWELL_MS');
    expect(homeAuthenticated).toContain('HOME_HERO_EXIT_MS');
    expect(homeAuthenticated).toContain('HOME_HERO_SEEN_SESSION_KEY');
    expect(homeAuthenticated).toContain("type HomeHeroIntroState = 'visible' | 'exiting' | 'gone';");
    expect(homeAuthenticated).toContain('heroIntroState');
    expect(homeAuthenticated).toContain('collapseHeroIntro');
    expect(homeAuthenticated).toContain("return shouldReduceMotion ? 'gone' : 'exiting';");
    expect(homeAuthenticated).toContain('setHeroIntroState(\'gone\')');
    expect(homeAuthenticated).toContain('rememberHomeHeroIntroSeen');
    expect(homeAuthenticated).toContain('shouldRenderHeroIntro');
    expect(homeAuthenticated).toContain('shouldReduceMotion');
    expect(homeAuthenticated).toContain('HOME_HERO_DRAG_DISMISS_THRESHOLD = 48');
    expect(homeAuthenticated).toContain('HOME_HERO_SCROLL_DISMISS_THRESHOLD = 32');
    expect(homeAuthenticated).toContain('Show dashboard');
    expect(homeAuthenticated).toContain('aria-controls="home-dashboard-grid"');
    expect(homeAuthenticated).toContain("disabled={heroIntroState !== 'visible'}");
    expect(homeAuthenticated).toContain("tabIndex={heroIntroState === 'visible' ? 0 : -1}");
    expect(homeAuthenticated).toContain('dashboardGridRef.current?.focus({ preventScroll: true });');
    expect(homeAuthenticated).toContain('collapseHeroIntro();');
    expect(homeAuthenticated).toContain('setPointerCapture');
    expect(homeAuthenticated).not.toContain('HOME_HERO_COLLAPSED_SESSION_KEY');
    expect(homeAuthenticated).not.toContain('expandHero');
    expect(homeAuthenticated).not.toContain('Show greeting');
    expect(homeAuthenticated).not.toContain('HomeHeroCollapseReason');
    expect(homeAuthenticated).not.toContain('lastHeroCollapseReasonRef');
    expect(homeAuthenticated).not.toContain('generateWritingNotes');
    expect(homeAuthenticated).not.toContain('dynamic_writing_notes');
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
    expect(homeAuthenticated).toContain('<MoodPicker');
    expect(read('pages/dashboard/moodConfig.ts')).toContain("'overthinking'");
    expect(read('pages/dashboard/moodConfig.ts')).toContain("'charged'");
    expect(homeAuthenticated.toLowerCase()).not.toContain('score');

    expect(createNote).toContain("title={moodPickerStage === 'group' ? 'How does it feel right now?' : undefined}");
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

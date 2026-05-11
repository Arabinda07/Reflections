import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('prompt-first UX contract', () => {
  it('makes authenticated home prompt-first and gates the media delight to the session', () => {
    const home = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(home).toContain('HOME_WELCOME_INTRO_SESSION_KEY');
    expect(home).toContain('WELCOME_INTRO_AUTO_DISMISS_MS');
    expect(home).toContain('HomeWelcomeIntro');
    expect(home).toContain('sessionStorage.getItem(HOME_WELCOME_INTRO_SESSION_KEY)');
    expect(home).toContain('sessionStorage.setItem(HOME_WELCOME_INTRO_SESSION_KEY');
    expect(home).toContain('const shouldShowWelcomeIntro =');
    expect(home).toContain("window.addEventListener('keydown', handleKeyDown)");
    expect(home).toContain("window.removeEventListener('keydown', handleKeyDown)");
    expect(home).not.toContain('onKeyDown={handleKeyDown}');
    expect(home).toContain('poster="/assets/videos/field.png"');
    expect(home).toContain('src="/assets/videos/field.mp4"');
    expect(home).not.toContain('role="dialog"');
    expect(home).not.toContain('aria-modal="true"');
    expect(home).not.toContain('introRef.current?.focus()');
    expect(home).not.toContain('aria-hidden={showOnboarding || shouldShowWelcomeIntro');

    expect(home).toContain('aria-labelledby="today-reflection-heading"');
    expect(home).toContain('id="today-reflection-heading"');
    expect(home.indexOf('id="today-reflection-heading"')).toBeLessThan(home.indexOf('Your Rhythm'));
    expect(home).not.toContain('h-[56dvh] min-h-[360px]');
    expect(home).not.toContain('hero-ink-accent');
  });

  it('puts home dashboard motion on a diet without removing purposeful feedback', () => {
    const home = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(home).toContain('if (shouldReduceMotion)');
    expect(home).toContain("transition-opacity duration-[400ms]");
    expect(home).not.toContain('anim-delay-');
    expect(home).not.toContain('animate-fade-in-up');
    expect(home).not.toContain('animate-shake-x');
    expect(home).not.toContain('group-hover:rotate');
    expect(home).not.toContain('group-hover:-rotate');
    expect(home).not.toContain('hover:scale');
    expect(home).not.toContain('translate-x-[-100%]');
  });

  it('uses a shared guide row language across disclosure and navigation surfaces', () => {
    expect(existsSync(path.resolve(process.cwd(), 'components/ui/GuideRow.tsx'))).toBe(true);

    const guideRow = read('components/ui/GuideRow.tsx');
    const css = read('index.css');
    const filesUsingGuideRow = [
      'pages/dashboard/Account.tsx',
      'pages/dashboard/FAQ.tsx',
      'pages/dashboard/HomeAuthenticated.tsx',
      'pages/dashboard/Insights.tsx',
      'pages/dashboard/LifeWiki.tsx',
      'pages/dashboard/PrivacyPolicy.tsx',
    ];

    expect(guideRow).toContain('export type GuideRowTone');
    expect(guideRow).toContain("titleAs?: 'span' | 'h2' | 'h3' | 'h4'");
    expect(guideRow).toContain('const TitleElement = titleAs');
    expect(guideRow).toContain('guide-row');
    expect(guideRow).toContain('aria-expanded');
    expect(guideRow).toContain('guide-row__affordance');
    ['paper', 'sage', 'sky', 'honey', 'clay'].forEach((tone) => {
      expect(css).toContain(`.guide-row--${tone}`);
    });

    filesUsingGuideRow.forEach((filePath) => {
      expect(read(filePath), filePath).toContain("import { GuideRow");
    });

    expect(read('pages/dashboard/Account.tsx')).toContain('titleAs="h3"');
    expect(read('pages/dashboard/Insights.tsx')).toContain('titleAs="h2"');
    expect(read('pages/dashboard/LifeWiki.tsx')).toContain('titleAs="h2"');
  });

  it('keeps FAQ and privacy content visible while adding mobile jump guides', () => {
    const faq = read('pages/dashboard/FAQ.tsx');
    const privacy = read('pages/dashboard/PrivacyPolicy.tsx');

    [
      ['#quick-guide', 'id="quick-guide"'],
      ['#practice', 'id="practice"'],
      ['#details', 'id="details"'],
      ['#features', 'id="features"'],
      ['#contact', 'id="contact"'],
    ].forEach(([href, id]) => {
      expect(faq).toContain(`href: '${href}'`);
      expect(faq).toContain(id);
    });

    [
      ['#short-version', 'id="short-version"'],
      ['#privacy-principles', 'id="privacy-principles"'],
      ['#full-policy', 'id="full-policy"'],
      ['#account-deletion', 'id="account-deletion"'],
    ].forEach(([href, id]) => {
      expect(privacy).toContain(`href: '${href}'`);
      expect(privacy).toContain(id);
    });

    expect(faq).toContain('FAQ_NAV_ITEMS');
    expect(privacy).toContain('PRIVACY_NAV_ITEMS');
    expect(faq).toContain('FAQ_SECTION_CONTINUATION_ITEMS');
    expect(privacy).toContain('PRIVACY_SECTION_CONTINUATION_ITEMS');
    expect(faq).toContain('Back to FAQ sections');
    expect(privacy).toContain('Back to privacy sections');
    expect(faq).not.toContain('<details');
    expect(privacy).not.toContain('<details');
  });

  it('moves secondary editor tools behind one Writing tools sheet on every viewport', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain('isWritingToolsOpen');
    expect(createNote).toContain('Writing tools');
    expect(createNote).toContain('openWritingTools');
    expect(createNote).toContain('renderWritingToolGrid');
    expect(createNote).toContain('filesInputRef');
    expect(createNote).toContain('coverInputRef');
    expect(createNote).toContain('aria-label="Add files"');
    expect(createNote).toContain('aria-label="Choose cover image"');
    expect(createNote).not.toContain('className="hidden"');
    expect(createNote).not.toContain('<label className="control-surface flex min-h-16 cursor-pointer');
    expect(createNote).not.toContain('isMobileOptionsOpen');
    expect(createNote).not.toContain('Personalize');
    expect(createNote).not.toContain('Desktop Sidebar');
  });

  it('switches the prompt FAB to the save choice as soon as the draft has title or body text', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain('const hasDraftText = Boolean(draft.currentSnapshot.title || draft.currentSnapshot.content);');
    expect(createNote).toContain('{!hasDraftText ? (');
    expect(createNote).toContain('aria-label="Show another writing prompt"');
    expect(createNote).toContain('aria-label="Choose what to do with this reflection"');
    expect(createNote).toContain('Save reflection');
    expect(createNote).toContain('Release');
    expect(createNote).not.toContain('const hasContent = Boolean(draft.currentSnapshot.content);');
    expect(createNote).not.toContain('{!hasContent ? (');
  });

  it('adds concrete signup decision support without changing newsletter behavior', () => {
    const signUp = read('pages/auth/SignUp.tsx');

    expect(signUp).toContain('SIGNUP_TRUST_POINTS');
    expect(signUp).toContain('Your notes stay private to your account.');
    expect(signUp).toContain('AI waits until you ask for it.');
    expect(signUp).toContain('Delete saved writing from Account.');
    expect(signUp).toContain('to={RoutePath.PRIVACY}');
    expect(signUp).toContain('useState(false)');
    expect(signUp).toContain('buildNewsletterOptInMetadata(newsletterOptIn)');
  });
});

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('engagement routes source contract', () => {
  it('declares release, future letter, and about routes without adding About to primary nav', () => {
    const app = read('App.tsx');
    const routes = read('types.ts');
    const layout = read('layouts/DashboardLayout.tsx');

    expect(routes).toContain("RELEASE = '/release'");
    expect(routes).toContain("FUTURE_LETTERS = '/letters'");
    expect(routes).toContain("ABOUT = '/about'");
    expect(app).toContain("import('./pages/dashboard/ReleaseMode')");
    expect(app).toContain("import('./pages/dashboard/FutureLetters')");
    expect(app).toContain("import('./pages/dashboard/AboutArabinda')");
    expect(app).toContain('path={RoutePath.RELEASE}');
    expect(app).toContain('path={RoutePath.FUTURE_LETTERS}');
    expect(app).toContain('path={RoutePath.ABOUT}');

    expect(layout).toContain('About Arabinda');
    expect(layout).toContain('to={RoutePath.ABOUT}');
    const authNavItems = layout.match(/const authNavItems = \[[\s\S]*?\];/)?.[0] || '';
    const guestNavItems = layout.match(/const guestNavItems = \[[\s\S]*?\];/)?.[0] || '';
    expect(authNavItems).not.toContain('About Arabinda');
    expect(guestNavItems).not.toContain('About Arabinda');
  });

  it('adds calm Home entry points for Release mode and future letters', () => {
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(homeAuthenticated).toContain('RoutePath.RELEASE');
    expect(homeAuthenticated).toContain('RoutePath.FUTURE_LETTERS');
    expect(homeAuthenticated).toContain('Release');
    expect(homeAuthenticated).toContain('Future letter');
    expect(homeAuthenticated.toLowerCase()).not.toMatch(/\b(streak|xp|leaderboard|lost|failed)\b/);
  });

  it('keeps Release mode ephemeral and out of note persistence', () => {
    expect(existsSync(path.resolve(process.cwd(), 'pages/dashboard/ReleaseMode.tsx'))).toBe(true);
    const releaseMode = read('pages/dashboard/ReleaseMode.tsx');

    expect(releaseMode).toContain("ritualEventService.recordReleaseCompleted");
    expect(releaseMode).toContain("buildCompletionCardPayload");
    expect(releaseMode).toContain("Release");
    expect(releaseMode).toContain("setText('')");
    expect(releaseMode).toContain('AnimatePresence');
    expect(releaseMode).toContain('onExitComplete={() => setText(\'\')}');
    expect(releaseMode).toContain('htmlFor="release-writing"');
    expect(releaseMode).toContain('id="release-writing"');
    expect(releaseMode).toContain('useReducedMotion');
    expect(releaseMode).not.toContain('setTimeout');
    expect(releaseMode).not.toContain('noteService');
    expect(releaseMode).not.toMatch(/create\s*\(/);
    expect(releaseMode).not.toMatch(/update\s*\(/);
    expect(releaseMode.toLowerCase()).not.toMatch(/\b(save note|tags|tasks|attachments|reflect with ai)\b/);
  });

  it('implements future letters with locked list and open-date choices', () => {
    expect(existsSync(path.resolve(process.cwd(), 'pages/dashboard/FutureLetters.tsx'))).toBe(true);
    const letters = read('pages/dashboard/FutureLetters.tsx');

    expect(letters).toContain('futureLetterService.create');
    expect(letters).toContain('futureLetterService.list');
    expect(letters).toContain('futureLetterService.open');
    expect(letters).toContain('getFutureLetterOpenState');
    expect(letters).toContain('7 days');
    expect(letters).toContain('30 days');
    expect(letters).toContain('6 months');
    expect(letters).toContain('1 year');
    expect(letters).toContain('Custom');
    expect(letters).toContain('Locked until');
    expect(letters).toContain('buildCompletionCardPayload');
    expect(letters).toContain('aria-live="polite"');
    expect(letters).toContain('aria-label="Custom open date"');
    expect(letters).toContain('isOpenDateValid');
    expect(letters).toContain('openingLetterId');
    expect(letters).toContain('break-words');
    expect(letters).not.toContain('noteService');
  });

  it('renders private-safe completion card actions on recap, release, and letter flows', () => {
    const cardActionsPath = 'components/ui/CompletionCardActions.tsx';
    expect(existsSync(path.resolve(process.cwd(), cardActionsPath))).toBe(true);
    const actions = read(cardActionsPath);
    const insights = read('pages/dashboard/Insights.tsx');
    const releaseMode = read('pages/dashboard/ReleaseMode.tsx');
    const letters = read('pages/dashboard/FutureLetters.tsx');

    expect(actions).toContain('shareCompletionCard');
    expect(actions).toContain('downloadCompletionCard');
    expect(actions).toContain("import('../../services/completionCardService')");
    expect(actions).toContain("ritualEventService.record('completion_card_created'");
    expect(actions).toContain('isErrorStatus');
    expect(actions).not.toMatch(/note\.content|mood|tags|aiSummary|theme/i);
    expect(insights).toContain('<CompletionCardActions');
    expect(releaseMode).toContain('<CompletionCardActions');
    expect(letters).toContain('<CompletionCardActions');
  });

  it('wires referral capture, invite actions, and accepted-signup tracking without rewards or social graph copy', () => {
    const layout = read('layouts/DashboardLayout.tsx');
    const account = read('pages/dashboard/Account.tsx');
    const signUp = read('pages/auth/SignUp.tsx');

    expect(layout).toContain('referralService.captureReferralCode');
    expect(layout).toContain('Invite');
    expect(layout).toContain('<ReferralInvitePanel');
    expect(account).toContain('<ReferralInvitePanel');
    expect(account).toContain('people joined from your invite');
    expect(signUp).toContain('referralService.recordAcceptedReferral');
    expect(read('components/ui/ReferralInvitePanel.tsx')).toContain('WarningCircle');
    expect(`${layout}\n${account}`.toLowerCase()).not.toMatch(/\b(reward|badge|leaderboard|feed|friends)\b/);
  });

  it('adds a footer-only About Arabinda page in a human founder voice', () => {
    expect(existsSync(path.resolve(process.cwd(), 'pages/dashboard/AboutArabinda.tsx'))).toBe(true);
    const about = read('pages/dashboard/AboutArabinda.tsx');

    expect(about).toContain('About Arabinda');
    expect(about).toContain('writing-first');
    expect(about).toContain('AI stays optional');
    expect(about).toContain('privacy');
    expect(about.toLowerCase()).not.toMatch(/\b(streak|score|xp|leaderboard|diagnose|therapy replacement)\b/);
  });

  it('keeps the new engagement pages away from viewport-scaled type', () => {
    const files = [
      'pages/dashboard/ReleaseMode.tsx',
      'pages/dashboard/FutureLetters.tsx',
      'pages/dashboard/AboutArabinda.tsx',
      'components/ui/CompletionCardActions.tsx',
      'components/ui/ReferralInvitePanel.tsx',
    ];

    for (const file of files) {
      expect(read(file), file).not.toContain('clamp(');
    }
  });
});

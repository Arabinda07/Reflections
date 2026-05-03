import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('phase 2/3 design-system rollout', () => {
  it('introduces the shared design-system primitive files', () => {
    const requiredFiles = [
      'components/ui/PageContainer.tsx',
      'components/ui/SectionHeader.tsx',
      'components/ui/Surface.tsx',
      'components/ui/Chip.tsx',
      'components/ui/MetadataPill.tsx',
      'components/ui/ModalSheet.tsx',
      'components/ui/EmptyState.tsx',
      'components/ui/Alert.tsx',
      'components/ui/OverlayFeedback.tsx',
    ];

    for (const filePath of requiredFiles) {
      expect(existsSync(path.resolve(process.cwd(), filePath)), `${filePath} should exist`).toBe(true);
    }
  });

  it('routes overlay surfaces through the shared modal and overlay-feedback primitives', () => {
    const confirmationDialog = read('components/ui/ConfirmationDialog.tsx');
    const loadingState = read('components/ui/LoadingState.tsx');
    const paperPlaneToast = read('components/ui/PaperPlaneToast.tsx');
    const companionObservation = read('components/ui/CompanionObservation.tsx');
    const ambientMusicButton = read('components/ui/AmbientMusicButton.tsx');
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');
    const indexCss = read('index.css');
    const modalCss = read('components/ui/modal-sheet.css');

    expect(confirmationDialog).toContain("from './ModalSheet'");
    expect(loadingState).toContain("from './OverlayFeedback'");
    expect(paperPlaneToast).toContain("from './OverlayFeedback'");
    expect(companionObservation).toContain("from './OverlayFeedback'");
    expect(ambientMusicButton).toContain("from './ModalSheet'");
    expect(homeAuthenticated).toContain('tone="sage"');
    expect(indexCss).toContain('--modal-sheet-backdrop-bg: rgba(var(--panel-bg-rgb), 0.88);');
    expect(indexCss).toContain('--modal-sheet-opaque-bg');
    expect(modalCss).toMatch(/\.modal-sheet-backdrop\s*{[^}]*background: var\(--modal-sheet-backdrop-bg\);/s);
    expect(modalCss).toMatch(/\.modal-sheet-panel\s*{[^}]*backdrop-filter: none;/s);
    expect(modalCss).not.toMatch(/\.modal-sheet-backdrop\s*{[^}]*background:\s*rgba\(var\(--panel-bg-rgb\), 0\.72\);/s);

    expect(loadingState).not.toContain('Schibsted Grotesk');
    expect(paperPlaneToast).not.toContain('Schibsted Grotesk');
    expect(ambientMusicButton).not.toContain('Schibsted Grotesk');
  });

  it('moves the drift-heavy pages onto the shared page, header, chip, and feedback primitives', () => {
    const myNotes = read('pages/dashboard/MyNotes.tsx');
    const singleNote = read('pages/dashboard/SingleNote.tsx');
    const insights = read('pages/dashboard/Insights.tsx');
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');
    const account = read('pages/dashboard/Account.tsx');
    const signIn = read('pages/auth/SignIn.tsx');
    const signUp = read('pages/auth/SignUp.tsx');
    const privacyPolicy = read('pages/dashboard/PrivacyPolicy.tsx');

    expect(myNotes).toContain("from '../../components/ui/PageContainer'");
    expect(myNotes).toContain('<SectionHeader');
    expect(myNotes).toContain('<Chip');
    expect(myNotes).toContain('<EmptyState');

    expect(singleNote).toContain('<MetadataPill');
    expect(singleNote).toContain('<ModalSheet');

    expect(insights).toContain('<SectionHeader');
    expect(lifeWiki).toContain('<PageContainer');
    expect(lifeWiki).toContain('<ReactMarkdown');

    expect(account).toContain('<Alert');
    expect(account).not.toContain('alert(');

    expect(signIn).not.toContain('href="#"');
    expect(signUp).toContain('<SectionHeader');
    expect(privacyPolicy).toContain('max-w-[1440px]');
    expect(privacyPolicy).toContain('What Reflections keeps');
    expect(privacyPolicy).toContain('AI and Smart Mode');
    expect(privacyPolicy).not.toContain('Privacy and terms');
  });

  it('keeps the brand color expansion token-driven and surface-based', () => {
    const css = read('index.css');
    const surface = read('components/ui/Surface.tsx');
    const surfaceTone = read('components/ui/surfaceTone.ts');
    const metadataPill = read('components/ui/MetadataPill.tsx');
    const design = read('DESIGN.md');
    const brandDesign = read('docs/brand/DESIGN.md');
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const insights = read('pages/dashboard/Insights.tsx');

    expect(css).toContain('--app-background-wash');
    expect(css).toContain('--surface-paper-bg');
    expect(css).toContain('--surface-current-bg');
    expect(css).toContain('--surface-current-border');
    expect(css).toContain('--surface-current-accent');
    expect(css).toContain('.surface-scope-sage');
    expect(css).toContain('.surface-tone-auto');
    expect(css).toContain('--surface-sage-bg');
    expect(css).toContain('--surface-sky-bg');
    expect(css).toContain('--surface-honey-bg');
    expect(css).toContain('--surface-clay-bg');
    expect(css).toContain('.tone-panel-sage');
    expect(css).toContain('.tone-icon-sky');
    expect(css).toContain('.tone-chip-honey');
    expect(css).toContain('outline-offset: 2px;');
    expect(css).toContain('color: oklch(from var(--green) l c h / 0.46);');
    expect(css).toContain('border-color: oklch(from var(--clay) l c h / 0.2);');
    expect(css).not.toMatch(/border-left:\s*(?:[2-9]|\d{2,})px/);
    expect(css).not.toContain('background-clip: text');

    expect(surfaceTone).toContain("export type SurfaceTone = 'inherit' | 'neutral' | 'paper' | 'sage' | 'sky' | 'honey' | 'clay'");
    expect(surfaceTone).toContain('SURFACE_TONE_CLASS');
    expect(surfaceTone).toContain('SURFACE_SCOPE_CLASS');
    expect(surfaceTone).toContain("clay: 'metadata-pill--clay'");
    expect(surface).toContain("tone = 'inherit'");
    expect(surface).toContain('SURFACE_TONE_CLASS[tone]');
    expect(surface).not.toContain('surface-tone-${tone}');
    expect(metadataPill).toContain('METADATA_TONE_CLASS[tone]');
    expect(design).toContain('Inherited Surface Rule');
    expect(design).toContain('surface-scope-sage');
    expect(brandDesign).toContain('Inherited Surface Rule');
    expect(brandDesign).toContain('neutral` is only a backward-compatible alias');
    expect(home).toContain('surface-scope-sage');
    expect(insights).toContain('tone="sky"');
    expect(insights).toContain('tone="honey"');
  });

  it('applies subtle pastel page washes without raw body-surface escape hatches', () => {
    const css = read('index.css');
    const dashboardLayout = read('layouts/DashboardLayout.tsx');
    const landing = read('pages/dashboard/Landing.tsx');
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');
    const myNotes = read('pages/dashboard/MyNotes.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const singleNote = read('pages/dashboard/SingleNote.tsx');
    const releaseMode = read('pages/dashboard/ReleaseMode.tsx');
    const futureLetters = read('pages/dashboard/FutureLetters.tsx');
    const insights = read('pages/dashboard/Insights.tsx');
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');
    const account = read('pages/dashboard/Account.tsx');
    const faq = read('pages/dashboard/FAQ.tsx');
    const privacyPolicy = read('pages/dashboard/PrivacyPolicy.tsx');
    const signIn = read('pages/auth/SignIn.tsx');
    const signUp = read('pages/auth/SignUp.tsx');
    const resetPassword = read('pages/auth/ResetPassword.tsx');

    expect(css).toContain('--page-wash:');
    expect(css).toMatch(/\.surface-scope-paper[\s\S]*--page-wash: var\(--page-wash-paper\);/);
    expect(css).toMatch(/\.surface-scope-sage[\s\S]*--page-wash: var\(--page-wash-sage\);/);
    expect(css).toMatch(/\.surface-scope-sky[\s\S]*--page-wash: var\(--page-wash-sky\);/);
    expect(css).toMatch(/\.surface-scope-honey[\s\S]*--page-wash: var\(--page-wash-honey\);/);
    expect(css).toMatch(/\.surface-scope-clay[\s\S]*--page-wash: var\(--page-wash-clay\);/);
    expect(css).toMatch(/\.page-wash\s*{[^}]*background: var\(--page-wash\);/s);
    expect(css).not.toContain('.bg-body-surface');

    expect(dashboardLayout).toContain('const ROUTE_SURFACE_SCOPE_CLASS');
    expect(dashboardLayout).toContain('const routeSurfaceScopeClass = getRouteSurfaceScopeClass(location.pathname);');
    expect(dashboardLayout).toContain('`${routeSurfaceScopeClass} page-wash');
    expect(dashboardLayout).toContain("[RoutePath.FAQ]: 'surface-scope-sky'");
    expect(dashboardLayout).toContain("[RoutePath.INSIGHTS]: 'surface-scope-sky'");
    expect(dashboardLayout).toContain("[RoutePath.FUTURE_LETTERS]: 'surface-scope-honey'");
    expect(dashboardLayout).toContain("[RoutePath.RELEASE]: 'surface-scope-clay'");
    expect(dashboardLayout).toContain("[RoutePath.ACCOUNT]: 'surface-scope-paper'");
    expect(landing).toContain('surface-scope-sage page-wash');
    expect(homeAuthenticated).toContain('surface-scope-sage page-wash');
    expect(myNotes).toContain('surface-scope-sage page-wash');
    expect(createNote).toContain('page-wash');
    expect(singleNote).toContain('surface-scope-paper page-wash');
    expect(releaseMode).toContain('surface-scope-clay page-wash');
    expect(futureLetters).toContain('surface-scope-honey page-wash');
    expect(insights).toContain('surface-scope-sky page-wash');
    expect(lifeWiki).toContain('surface-scope-sage page-wash');
    expect(account).toContain('surface-scope-paper page-wash');
    expect(faq).toContain('surface-scope-sky page-wash');
    expect(privacyPolicy).toContain('surface-scope-paper page-wash');
    expect(signIn).toContain('surface-scope-paper page-wash');
    expect(signUp).toContain('surface-scope-paper page-wash');
    expect(resetPassword).toContain('surface-scope-paper page-wash');

    expect(faq).not.toContain('bg-body-surface');
    expect(privacyPolicy).not.toContain('bg-body-surface');
  });

  it('applies the Reflections semantic color roles to primitives and route surfaces', () => {
    const button = read('components/ui/Button.tsx');
    const input = read('components/ui/Input.tsx');
    const toast = read('components/ui/Toast.tsx');
    const confirmationDialog = read('components/ui/ConfirmationDialog.tsx');
    const proUpgrade = read('components/ui/ProUpgradeCTA.tsx');
    const dashboardLayout = read('layouts/DashboardLayout.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const moodConfig = read('pages/dashboard/moodConfig.ts');
    const insights = read('pages/dashboard/Insights.tsx');

    expect(button).toContain('primary: "border border-transparent bg-green text-white');
    expect(button).toContain('danger: "border border-transparent bg-clay text-white');
    expect(button).not.toContain('bg-red text-white');

    expect(input).toContain('focus:border-green focus:ring-2 focus:ring-green/10');
    expect(input).toContain('border-clay');
    expect(input).not.toContain('ring-red');

    expect(toast).toContain("info: 'border-sky/20 bg-sky/5 text-sky'");
    expect(toast).toContain("warning: 'border-honey/20 bg-honey/5 text-honey'");
    expect(confirmationDialog).toContain("tone={variant === 'danger' ? 'clay' : 'paper'}");

    expect(proUpgrade).toContain('tone="honey"');
    expect(proUpgrade).toContain('surface-tone-honey');
    expect(proUpgrade).toContain('!bg-honey');
    expect(proUpgrade).not.toContain("selectedPlan === 'monthly' ? 'border-green bg-green/5'");

    expect(dashboardLayout).toContain("aria-current={isActive ? 'page' : undefined}");
    expect(dashboardLayout).toContain('border-green bg-green/5 text-green');
    expect(dashboardLayout).toContain('text-clay hover:bg-clay/5');

    expect(createNote).toContain('Reflect with AI');
    expect(createNote).toContain('bg-green px-4 py-2');
    expect(createNote).toContain('text-white');
    expect(createNote).toContain('title="AI reflection"');
    expect(createNote).toContain('tone="sage"');

    expect(moodConfig).toContain('bg-mood-calm/10 border-mood-calm/20 text-mood-calm');
    expect(moodConfig).not.toContain('bg-blue/10');
    expect(moodConfig).not.toContain('text-red');
    expect(moodConfig).not.toContain('bg-golden/10');
    expect(moodConfig).not.toContain('text-dark-blue');

    expect(insights).toContain('surface-scope-sky');
    expect(insights).toContain('tone="sky"');
    expect(insights).toContain("const TAG_TONE_CLASSES = ['text-green', 'text-green/80', 'text-green/70', 'text-green/60'];");
  });

  it('keeps header buttons responsive without changing the calm brand treatment', () => {
    const button = read('components/ui/Button.tsx');
    const sectionHeader = read('components/ui/SectionHeader.tsx');
    const dashboardLayout = read('layouts/DashboardLayout.tsx');
    const css = read('index.css');

    expect(sectionHeader).toContain('section-header-actions');
    expect(css).toMatch(/\.section-header-actions\s*{[^}]*flex-wrap: wrap;/s);
    expect(css).toMatch(/\.section-header-actions\s*{[^}]*width: 100%;/s);
    expect(css).toMatch(/@media \(max-width: 639px\)[\s\S]*\.section-header-actions :where\(button, a\)/);

    expect(button).toContain('useReducedMotion');
    expect(button).toContain('transition-[background-color,border-color,color,box-shadow,transform,filter]');
    expect(button).toContain('motion-reduce:transition-none');
    expect(button).not.toContain('transition-all');

    expect(dashboardLayout).toContain("isMobileNavSuppressedRoute ? 'hidden lg:flex' : 'flex'");
    expect(dashboardLayout).toContain('hidden lg:flex items-center gap-1.5 xl:gap-2');
    expect(dashboardLayout).toContain('lg:hidden items-center gap-2');
    expect(dashboardLayout).toContain('px-3 xl:px-4');
  });

  it('keeps card-like surfaces off raw white and panel background escape hatches', () => {
    const cardSurfaceFiles = [
      'components/ui/CompletionCardActions.tsx',
      'components/ui/ReferralInvitePanel.tsx',
      'pages/dashboard/ReleaseMode.tsx',
      'pages/dashboard/FutureLetters.tsx',
      'pages/dashboard/LifeWiki.tsx',
      'pages/dashboard/Account.tsx',
    ];

    for (const filePath of cardSurfaceFiles) {
      const source = read(filePath);
      expect(source, filePath).not.toContain('bg-panel-bg/80');
      expect(source, filePath).not.toContain('bg-white/5');
      expect(source, filePath).not.toContain('bg-white/60');
      expect(source, filePath).toMatch(/surface-(?:inline-panel|scope-|tone-|flat|bezel)/);
    }
  });
});

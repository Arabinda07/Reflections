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

    expect(confirmationDialog).toContain("from './ModalSheet'");
    expect(loadingState).toContain("from './OverlayFeedback'");
    expect(paperPlaneToast).toContain("from './OverlayFeedback'");
    expect(companionObservation).toContain("from './OverlayFeedback'");
    expect(ambientMusicButton).toContain("from './ModalSheet'");

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
    expect(privacyPolicy).toContain('Privacy and terms');
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
    expect(css).not.toMatch(/border-left:\s*(?:[2-9]|\d{2,})px/);
    expect(css).not.toContain('background-clip: text');

    expect(surfaceTone).toContain("export type SurfaceTone = 'inherit' | 'neutral' | 'paper' | 'sage' | 'sky' | 'honey' | 'clay'");
    expect(surfaceTone).toContain('SURFACE_TONE_CLASS');
    expect(surfaceTone).toContain('SURFACE_SCOPE_CLASS');
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

  it('keeps card-like surfaces off raw white and panel background escape hatches', () => {
    const cardSurfaceFiles = [
      'components/ui/CompletionCardActions.tsx',
      'components/ui/ReferralInvitePanel.tsx',
      'pages/dashboard/NoteExportDialog.tsx',
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

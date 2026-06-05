import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('private writing onboarding module contract', () => {
  it('keeps first-time setup inside the feature flow instead of the home page', () => {
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const flow = read('features/private-writing-onboarding/PrivateWritingOnboardingFlow.tsx');
    const setupStep = read('features/private-writing-onboarding/PrivateWritingSetupStep.tsx');

    expect(home).toContain('PrivateWritingOnboardingFlow');
    expect(home).not.toContain('const [onboardingStep');
    expect(home).not.toContain('consumePendingAccountPassword');
    expect(flow).toContain('const [onboardingStep');
    expect(flow).toContain('onSetupComplete={handlePrivateWritingSetupComplete}');
    expect(setupStep).toContain('consumePendingAccountPassword');
  });

  it('keeps setup account password handoff behind a product adapter', () => {
    const handoff = read('src/auth/accountPasswordHandoff.ts');
    const setupStep = read('features/private-writing-onboarding/PrivateWritingSetupStep.tsx');

    expect(handoff).toContain('storePendingAccountPassword');
    expect(handoff).toContain('consumePendingAccountPassword');
    expect(handoff).toContain("storeVolatileAuthSecret('account_password_setup'");
    expect(handoff).toContain("consumeVolatileAuthSecret('account_password_setup', userId)");
    expect(handoff).not.toContain('setTimeout');
    expect(handoff).not.toContain('localStorage');

    expect(setupStep).toContain('const [requiresAccountPassword, setRequiresAccountPassword]');
    expect(setupStep).toContain('const pendingPassword = consumePendingAccountPassword(userId)');
    expect(setupStep).toContain('setRequiresAccountPassword(true)');
    expect(setupStep).toContain('if (!pendingPassword && email)');
  });

  it('keeps setup completion separate from onboarding completion', () => {
    const flow = read('features/private-writing-onboarding/PrivateWritingOnboardingFlow.tsx');
    const setupStep = read('features/private-writing-onboarding/PrivateWritingSetupStep.tsx');

    expect(flow).toContain('hasCompletedPrivateWritingSetup');
    expect(flow).toContain('setHasCompletedPrivateWritingSetup(true)');
    expect(flow).toContain('await completeOnboarding();');
    expect(setupStep).toContain('onSetupComplete');
    expect(setupStep).not.toContain('completeOnboarding');
  });

  it('keeps account-password reuse explicit and unavailable to Google-like auth', () => {
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const setupStep = read('features/private-writing-onboarding/PrivateWritingSetupStep.tsx');

    expect(home).toContain("const isGoogleLikeAuth = user?.authProvider === 'google'");
    expect(home).toContain('canOfferAccountPassword={!isGoogleLikeAuth}');
    expect(setupStep).toContain("canOfferAccountPassword ? 'account_password' : 'private_writing_password'");
    expect(setupStep).toContain('Use my account password');
    expect(setupStep).toContain('Recommended');
    expect(setupStep).toContain('Google signs you in. A private-writing password unlocks your writing inside Reflections.');
  });

  it('keeps required encryption setup non-dismissible and recovery-confirmed', () => {
    const flow = read('features/private-writing-onboarding/PrivateWritingOnboardingFlow.tsx');
    const setupStep = read('features/private-writing-onboarding/PrivateWritingSetupStep.tsx');

    expect(flow).toContain('const canDismissOnboarding = !isSetupRequired');
    expect(flow).toContain('disableDismiss={!canDismissOnboarding}');
    expect(flow).toContain('hideClose={!canDismissOnboarding}');
    expect(setupStep).toContain('hasSavedRecoveryKey');
    expect(setupStep).toContain('typedRecoveryKey.trim() === recoveryKey');
    expect(setupStep).toContain('disabled={isSubmitting || !isRecoveryConfirmed}');
  });

  it('keeps Supabase profile state as the onboarding source of truth', () => {
    const hook = read('features/private-writing-onboarding/usePrivateWritingOnboarding.ts');

    expect(hook).toContain('profileService.getOnboardingState');
    expect(hook).toContain('profileService.completeOnboarding');
    expect(hook).toContain('PRIVATE_WRITING_ONBOARDING_VERSION');
    expect(hook).not.toContain('localStorage');
    expect(hook).not.toContain('hasSeenOnboarding');
  });
});

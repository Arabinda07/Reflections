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
    expect(setupStep).toContain('You signed in with Google, so there is no Reflections account password to reuse.');
  });

  it('keeps setup submission semantic, retryable, and visibly busy', () => {
    const setupStep = read('features/private-writing-onboarding/PrivateWritingSetupStep.tsx');

    expect(setupStep).toContain('<form className="space-y-5" onSubmit=');
    expect(setupStep).toContain('type="submit"');
    expect(setupStep).toContain('name="account-password"');
    expect(setupStep).toContain('autoComplete="current-password"');
    expect(setupStep).toContain('required');
    expect(setupStep).toContain('usedPendingPassword');
    expect(setupStep).toContain('if (usedPendingPassword) setRequiresAccountPassword(true);');
    expect(setupStep).toContain('isLoading={isSubmitting}');
    expect(setupStep).toContain("isSubmitting ? 'Creating private-writing key'");
  });

  it('keeps required encryption setup non-dismissible and recovery-confirmed', () => {
    const flow = read('features/private-writing-onboarding/PrivateWritingOnboardingFlow.tsx');
    const setupStep = read('features/private-writing-onboarding/PrivateWritingSetupStep.tsx');

    expect(flow).toContain('const canDismissOnboarding = !shouldShowPrivateWritingSetup');
    expect(flow).toContain('disableDismiss={!canDismissOnboarding}');
    expect(flow).toContain('hideClose={!canDismissOnboarding}');
    expect(setupStep).toContain('Private writing setup: 1 of 2');
    expect(setupStep).toContain('Private writing setup: 2 of 2');
    expect(setupStep).toContain('Copy recovery phrase');
    expect(setupStep).toContain('Reflections cannot see it, reset it, or restore it for you if it is lost.');
    expect(setupStep).toContain('hasSavedRecoveryKey');
    expect(setupStep).toContain('typedRecoveryKey.trim() === recoveryKey');
    expect(setupStep).toContain('disabled={isSubmitting || !isRecoveryConfirmed}');
  });

  it('routes successful setup into a ready screen before optional guidance', () => {
    const flow = read('features/private-writing-onboarding/PrivateWritingOnboardingFlow.tsx');
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const state = read('features/private-writing-onboarding/onboardingFlowState.ts');

    expect(flow).toContain('shouldShowSetupReady');
    expect(flow).toContain('getPrivateWritingOnboardingView');
    expect(state).toContain("return 'ready';");
    expect(flow).toContain('Your private space is ready');
    expect(flow).toContain('Write first reflection');
    expect(flow).toContain('Show me around');
    expect(flow).toContain("recordOnboardingFunnelEvent('setup_ready_cta_clicked'");
    expect(home).toContain("initialPrompt: 'Start with one true sentence.'");
  });

  it('keeps write-first-reflection from completing optional onboarding before save', () => {
    const flow = read('features/private-writing-onboarding/PrivateWritingOnboardingFlow.tsx');
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const hook = read('features/private-writing-onboarding/usePrivateWritingOnboarding.ts');
    const state = read('features/private-writing-onboarding/onboardingFlowState.ts');

    expect(flow).toContain('onExitToWriting');
    expect(home).toContain('onExitToWriting={onboarding.exitToWriting}');
    expect(hook).toContain('const exitToWriting = useCallback(() => {');
    expect(hook).toContain('setShouldShowOnboarding(false);');
    expect(state).toContain("action !== 'write_first_reflection'");
    expect(flow).toContain("shouldCompleteOnboardingForAction('write_first_reflection')");
    expect(flow).toContain('await exitToWritingAndReset();');
  });

  it('keeps onboarding funnel events internal and free of secrets', () => {
    const funnel = read('services/onboardingFunnelService.ts');
    const setupStep = read('features/private-writing-onboarding/PrivateWritingSetupStep.tsx');
    const draftHook = read('hooks/useNoteDraft.ts');

    expect(funnel).toContain("ONBOARDING_FUNNEL_BROWSER_EVENT = 'reflections:onboarding-funnel'");
    expect(funnel).toContain('window.dispatchEvent');
    expect(funnel).toContain('CustomEvent');
    expect(funnel).not.toContain('fetch(');
    expect(funnel).not.toContain('supabase');
    expect(funnel).not.toContain('localStorage');
    expect(funnel).not.toContain('secret');
    expect(funnel).not.toContain('password');
    expect(setupStep).toContain("recordOnboardingFunnelEvent('private_writing_setup_started'");
    expect(setupStep).toContain("recordOnboardingFunnelEvent('private_writing_key_created', { method: unlockMethod })");
    expect(draftHook).toContain("recordOnboardingFunnelEvent('first_private_reflection_saved'");
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

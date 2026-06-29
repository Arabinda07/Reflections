import { describe, expect, it } from 'vitest';
import { getPrivateWritingOnboardingView } from './onboardingFlowState';

describe('private writing onboarding flow state', () => {
  it('keeps the ready screen visible after setup-required flips false', () => {
    expect(
      getPrivateWritingOnboardingView({
        isSetupRequired: false,
        hasCompletedPrivateWritingSetup: true,
        isOptionalGuidanceOpen: false,
      }),
    ).toBe('ready');
  });

  it('keeps setup mandatory before recovery confirmation', () => {
    expect(
      getPrivateWritingOnboardingView({
        isSetupRequired: true,
        hasCompletedPrivateWritingSetup: false,
        isOptionalGuidanceOpen: false,
      }),
    ).toBe('setup');
  });
});

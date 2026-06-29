export type PrivateWritingOnboardingView = 'setup' | 'ready' | 'optional_guidance';

export const getPrivateWritingOnboardingView = ({
  isSetupRequired,
  hasCompletedPrivateWritingSetup,
  isOptionalGuidanceOpen,
}: {
  isSetupRequired: boolean;
  hasCompletedPrivateWritingSetup: boolean;
  isOptionalGuidanceOpen: boolean;
}): PrivateWritingOnboardingView => {
  if (isSetupRequired && !hasCompletedPrivateWritingSetup) {
    return 'setup';
  }

  if (hasCompletedPrivateWritingSetup && !isOptionalGuidanceOpen) {
    return 'ready';
  }

  return 'optional_guidance';
};

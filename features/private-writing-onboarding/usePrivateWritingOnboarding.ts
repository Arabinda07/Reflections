import { useCallback, useEffect, useState } from 'react';
import { profileService } from '../../services/profileService';
import { PRIVATE_WRITING_ONBOARDING_VERSION } from './onboardingContent';

export const usePrivateWritingOnboarding = ({
  hasUser,
  isSetupRequired,
}: {
  hasUser: boolean;
  isSetupRequired: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadOnboardingState = async () => {
      setIsLoading(true);
      try {
        const state = await profileService.getOnboardingState();
        if (!isActive) return;

        const completed = Boolean(
          state.completedAt && (state.versionSeen || 0) >= PRIVATE_WRITING_ONBOARDING_VERSION,
        );
        setHasCompletedOnboarding(completed);
        setShouldShowOnboarding(!completed || isSetupRequired);
      } catch {
        if (!isActive) return;
        setHasCompletedOnboarding(false);
        setShouldShowOnboarding(true);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    if (hasUser) {
      void loadOnboardingState();
      return () => {
        isActive = false;
      };
    }

    setIsLoading(false);
    setHasCompletedOnboarding(null);
    setShouldShowOnboarding(false);

    return () => {
      isActive = false;
    };
  }, [hasUser, isSetupRequired]);

  const complete = useCallback(async () => {
    await profileService.completeOnboarding(PRIVATE_WRITING_ONBOARDING_VERSION);
    setHasCompletedOnboarding(true);
  }, []);

  const dismiss = useCallback(async () => {
    if (isSetupRequired) return;
    await complete();
    setShouldShowOnboarding(false);
  }, [complete, isSetupRequired]);

  const canDismissOnboarding = !isSetupRequired && hasCompletedOnboarding === true;

  return {
    isLoading,
    shouldShowOnboarding,
    canDismissOnboarding,
    isSetupRequired,
    complete,
    dismiss,
  };
};

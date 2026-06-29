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
        // Only the mandatory encryption-setup step auto-opens. The optional tour
        // must never nag returning users, so it is not gated on the (best-effort)
        // DB completion flag - the post-setup session shows it via justCompletedSetup.
        setShouldShowOnboarding(isSetupRequired);
      } catch {
        if (!isActive) return;
        setHasCompletedOnboarding(false);
        setShouldShowOnboarding(isSetupRequired);
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
    // Best-effort persistence: a failed profile write must never trap the user
    // inside the modal. Dismiss regardless; it re-syncs on the next session.
    try {
      await profileService.completeOnboarding(PRIVATE_WRITING_ONBOARDING_VERSION);
    } catch (error) {
      console.error('[onboarding] completion not persisted; dismissing anyway', error);
    }
    setHasCompletedOnboarding(true);
    setShouldShowOnboarding(false);
  }, []);

  const dismiss = useCallback(async () => {
    if (isSetupRequired) return;
    await complete();
    setShouldShowOnboarding(false);
  }, [complete, isSetupRequired]);

  const exitToWriting = useCallback(() => {
    setShouldShowOnboarding(false);
  }, []);

  const canDismissOnboarding = !isSetupRequired && hasCompletedOnboarding === true;

  return {
    isLoading,
    shouldShowOnboarding,
    canDismissOnboarding,
    isSetupRequired,
    complete,
    dismiss,
    exitToWriting,
  };
};

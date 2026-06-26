import React, { useCallback, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { recordOnboardingFunnelEvent } from '../../services/onboardingFunnelService';
import type { UnlockMethod } from '../../services/keyWrapperPolicy';
import {
  PRIVATE_WRITING_ONBOARDING_STEPS,
  privateWritingOnboardingStepIcons,
} from './onboardingContent';
import { getPrivateWritingOnboardingView } from './onboardingFlowState';
import { PrivateWritingSetupStep } from './PrivateWritingSetupStep';

export const PrivateWritingOnboardingFlow: React.FC<{
  isOpen: boolean;
  onClose: () => Promise<void> | void;
  onExitToWriting: () => Promise<void> | void;
  onBeginWriting?: () => Promise<void> | void;
  isSetupRequired: boolean;
  canOfferAccountPassword: boolean;
  hasFreshAccountPassword: boolean;
  userId: string;
  email?: string;
  setupEncryption: (secret: string, unlockMethod?: UnlockMethod) => Promise<void>;
  confirmRecoveryKey: (recoveryKey: string) => Promise<void>;
  recoveryKey: string | null;
  completeOnboarding: () => Promise<void> | void;
  justCompletedSetup: boolean;
  clearJustCompletedSetup: () => void;
}> = ({
  isOpen,
  onClose,
  onExitToWriting,
  onBeginWriting,
  isSetupRequired,
  canOfferAccountPassword,
  hasFreshAccountPassword,
  userId,
  email,
  setupEncryption,
  confirmRecoveryKey,
  recoveryKey,
  completeOnboarding,
  justCompletedSetup,
  clearJustCompletedSetup,
}) => {
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isOptionalGuidanceOpen, setIsOptionalGuidanceOpen] = useState(false);
  const currentOnboardingStep = PRIVATE_WRITING_ONBOARDING_STEPS[onboardingStep];
  const isLastOnboardingStep = onboardingStep === PRIVATE_WRITING_ONBOARDING_STEPS.length - 1;
  const CurrentOnboardingIcon = privateWritingOnboardingStepIcons[onboardingStep];
  // Local flag covers the in-session case; justCompletedSetup survives the
  // PrivateDataGate remount (migrating -> unlocked) that wipes local state.
  const [localSetupComplete, setHasCompletedPrivateWritingSetup] = useState(false);
  const hasCompletedPrivateWritingSetup = localSetupComplete || justCompletedSetup;
  const currentView = getPrivateWritingOnboardingView({
    isSetupRequired,
    hasCompletedPrivateWritingSetup,
    isOptionalGuidanceOpen,
  });
  const shouldShowPrivateWritingSetup = currentView === 'setup';
  const shouldShowSetupReady = currentView === 'ready';
  const shouldShowOptionalGuidance = currentView === 'optional_guidance';
  const canDismissOnboarding = !shouldShowPrivateWritingSetup;

  const closeAndReset = useCallback(async () => {
    if (shouldShowPrivateWritingSetup) return;
    await onClose();
    setOnboardingStep(0);
    setIsOptionalGuidanceOpen(false);
  }, [onClose, shouldShowPrivateWritingSetup]);

  const exitToWritingAndReset = useCallback(async () => {
    await onExitToWriting();
    setOnboardingStep(0);
    setIsOptionalGuidanceOpen(false);
  }, [onExitToWriting]);

  const handleSkipOnboarding = useCallback(async (source: 'optional_guidance' | 'ready_screen' = 'optional_guidance') => {
    recordOnboardingFunnelEvent('onboarding_skipped', { source });
    clearJustCompletedSetup();
    await completeOnboarding();
    await closeAndReset();
  }, [clearJustCompletedSetup, closeAndReset, completeOnboarding]);

  const handleFinishOnboarding = useCallback(async () => {
    recordOnboardingFunnelEvent('onboarding_completed', { source: 'optional_guidance' });
    await completeOnboarding();
    await closeAndReset();
    await onBeginWriting?.();
  }, [closeAndReset, completeOnboarding, onBeginWriting]);

  const handlePrivateWritingSetupComplete = useCallback(async () => {
    setHasCompletedPrivateWritingSetup(true);
    setOnboardingStep(0);
    setIsOptionalGuidanceOpen(false);
  }, []);

  const handleWriteFirstReflection = useCallback(async () => {
    recordOnboardingFunnelEvent('setup_ready_cta_clicked', { cta: 'write_first_reflection' });
    clearJustCompletedSetup();
    // Persist completion now so onboarding never re-opens on later visits; the
    // first-reflection-saved trigger stays as a harmless backup.
    await completeOnboarding();
    await exitToWritingAndReset();
    await onBeginWriting?.();
  }, [clearJustCompletedSetup, completeOnboarding, exitToWritingAndReset, onBeginWriting]);

  const handleShowMeAround = useCallback(() => {
    recordOnboardingFunnelEvent('setup_ready_cta_clicked', { cta: 'show_me_around' });
    clearJustCompletedSetup();
    setOnboardingStep(0);
    setIsOptionalGuidanceOpen(true);
  }, [clearJustCompletedSetup]);

  const handleNextOnboardingStep = useCallback(() => {
    if (isSetupRequired && onboardingStep === 0) {
      setOnboardingStep(1);
      return;
    }

    if (isLastOnboardingStep) {
      void handleFinishOnboarding();
      return;
    }

    setOnboardingStep((current) =>
      Math.min(current + 1, PRIVATE_WRITING_ONBOARDING_STEPS.length - 1),
    );
  }, [handleFinishOnboarding, isLastOnboardingStep, isSetupRequired, onboardingStep]);

  const handlePreviousOnboardingStep = useCallback(() => {
    setOnboardingStep((current) => Math.max(current - 1, 0));
  }, []);

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={() => void closeAndReset()}
      title={
        shouldShowPrivateWritingSetup
          ? 'Set up private writing'
          : shouldShowSetupReady
            ? 'Your private space is ready'
            : currentOnboardingStep.title
      }
      size="lg"
      mobilePlacement="center"
      disableDismiss={!canDismissOnboarding}
      hideClose={!canDismissOnboarding}
      closeLabel="Skip onboarding"
      panelClassName="onboarding-modal-panel"
      bodyClassName="onboarding-modal-body"
      footer={shouldShowPrivateWritingSetup || shouldShowSetupReady ? undefined : (
        <div className="onboarding-footer-actions flex flex-col gap-3 sm:gap-4">
          {canDismissOnboarding ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleSkipOnboarding('optional_guidance')}
              aria-label="Skip onboarding"
              className="self-center px-3 text-gray-nav hover:text-green"
            >
              Skip onboarding
            </Button>
          ) : null}
          <div className="flex items-center justify-between gap-3 sm:justify-between">
            <Button
              variant="secondary"
              onClick={handlePreviousOnboardingStep}
              disabled={onboardingStep === 0 || shouldShowPrivateWritingSetup}
              className="min-w-[6.75rem] flex-1 sm:flex-none"
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleNextOnboardingStep}
              disabled={shouldShowPrivateWritingSetup}
              className="min-w-[8.75rem] flex-1 sm:flex-none"
            >
              {isLastOnboardingStep ? 'Begin writing' : 'Next'}
            </Button>
          </div>
        </div>
      )}
    >
      {shouldShowPrivateWritingSetup ? (
        <PrivateWritingSetupStep
          canOfferAccountPassword={canOfferAccountPassword}
          hasFreshAccountPassword={hasFreshAccountPassword}
          userId={userId}
          email={email}
          setupEncryption={setupEncryption}
          confirmRecoveryKey={confirmRecoveryKey}
          recoveryKey={recoveryKey}
          onSetupComplete={handlePrivateWritingSetupComplete}
        />
      ) : shouldShowSetupReady ? (
        <div className="flex min-h-[18rem] flex-col justify-between gap-6 pb-1 sm:min-h-[19rem] animate-fade-in-up">
          <div className="space-y-4">
            <p className="label-caps text-green">Private writing setup complete</p>
            <div className="rounded-sm border border-green/20 bg-green/5 p-5 sm:p-6">
              <p className="text-base font-semibold leading-relaxed text-gray-text">
                Your private writing key is connected and your recovery phrase is confirmed.
              </p>
              <p className="mt-3 text-sm text-gray-nav">
                Start with one true sentence. The rest can arrive after.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={() => void handleWriteFirstReflection()}
              className="min-h-12 w-full"
            >
              Begin writing
            </Button>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowMeAround}
                className="px-3 text-gray-nav hover:text-green"
              >
                Show me around
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleSkipOnboarding('ready_screen')}
                className="px-3 text-gray-nav hover:text-green"
              >
                Maybe later
              </Button>
            </div>
          </div>
        </div>
      ) : shouldShowOptionalGuidance ? (
        <div
          key={currentOnboardingStep.title}
          className="onboarding-step-copy flex min-h-[18rem] flex-col justify-between gap-6 pb-1 sm:min-h-[19rem] animate-fade-in-up"
        >
          <div className="space-y-4">
            <p className="label-caps text-green" aria-live="polite">
              Step {onboardingStep + 1} of {PRIVATE_WRITING_ONBOARDING_STEPS.length}
            </p>

            <div className="onboarding-progress-rail grid grid-cols-4 gap-2" aria-hidden="true">
              {PRIVATE_WRITING_ONBOARDING_STEPS.map((step, index) => (
                <span
                  key={step.label}
                  className={`h-1.5 rounded-full bg-green transition-opacity duration-300 ease-out-expo ${
                    index <= onboardingStep ? 'opacity-100' : 'opacity-20'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="onboarding-step-stage relative overflow-hidden rounded-sm border border-border bg-surface-muted/70 p-5 sm:p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-green/20 bg-green/10 text-green">
              <CurrentOnboardingIcon size={28} weight="duotone" />
            </div>
            <div className="space-y-3">
              <p className="text-base font-semibold leading-relaxed text-gray-text">
                {currentOnboardingStep.body}
              </p>
              <p className="onboarding-step-note text-sm text-gray-nav">
                {currentOnboardingStep.note}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </ModalSheet>
  );
};

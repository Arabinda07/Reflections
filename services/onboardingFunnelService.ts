import type { UnlockMethod } from './keyWrapperPolicy';

export type OnboardingFunnelEventName =
  | 'private_writing_setup_started'
  | 'private_writing_unlock_method_selected'
  | 'private_writing_key_created'
  | 'recovery_phrase_confirmed'
  | 'setup_ready_cta_clicked'
  | 'onboarding_skipped'
  | 'onboarding_completed'
  | 'first_private_reflection_saved';

type OnboardingFunnelEventProperties = {
  private_writing_setup_started: Record<string, never>;
  private_writing_unlock_method_selected: { method: UnlockMethod };
  private_writing_key_created: { method: UnlockMethod };
  recovery_phrase_confirmed: Record<string, never>;
  setup_ready_cta_clicked: { cta: 'write_first_reflection' | 'show_me_around' };
  onboarding_skipped: { source: 'optional_guidance' | 'ready_screen' };
  onboarding_completed: { source: 'optional_guidance' | 'first_reflection_saved' };
  first_private_reflection_saved: Record<string, never>;
};

export type OnboardingFunnelEventDetail<TEvent extends OnboardingFunnelEventName = OnboardingFunnelEventName> = {
  event: TEvent;
  properties: OnboardingFunnelEventProperties[TEvent];
  timestamp: string;
};

export const ONBOARDING_FUNNEL_BROWSER_EVENT = 'reflections:onboarding-funnel';

export const recordOnboardingFunnelEvent = <TEvent extends OnboardingFunnelEventName>(
  event: TEvent,
  properties: OnboardingFunnelEventProperties[TEvent],
) => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<OnboardingFunnelEventDetail<TEvent>>(ONBOARDING_FUNNEL_BROWSER_EVENT, {
      detail: {
        event,
        properties,
        timestamp: new Date().toISOString(),
      },
    }),
  );
};

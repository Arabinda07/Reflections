import { supabase } from '../supabaseClient';

/**
 * Determines whether a signed-in user still needs to complete onboarding — i.e.
 * choose their permanent privacy mode on `ModeSelect`.
 *
 * FAIL-SAFE CONTRACT: the mode choice is permanent, so the only safe default is
 * "onboarding is incomplete". If the profile row cannot be read (transient
 * network/RLS error) or has not materialized yet (replication lag right after
 * signup), we return `true` and send the user to `ModeSelect` rather than
 * letting them slip past it and be silently locked to the default `reflective`
 * mode forever.
 *
 * A false "incomplete" is self-correcting and never traps the user: `ModeSelect`
 * redirects already-onboarded users straight back to the dashboard, and the
 * `set_user_mode` RPC reports "already been set" for a duplicate choice.
 */
export const isOnboardingIncomplete = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[onboardingStatus] Failed to read onboarding status:', error);
    return true;
  }

  return !data?.onboarding_completed_at;
};

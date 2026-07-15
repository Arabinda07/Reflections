-- Allow authenticated clients to read onboarding status columns.
-- Required by isOnboardingIncomplete / ModeSelect / profileService.
-- Mode writes remain server-owned via set_user_mode (no client UPDATE grant).
--
-- PRODUCTION HOTFIX (if lockdown was already applied before this migration):
-- Run the GRANT below in the Supabase SQL editor immediately. Until it lands,
-- already-onboarded users are trapped on /onboarding/mode-select because
-- SELECT onboarding_completed_at fails and the fail-safe treats them as new.

grant select (onboarding_completed_at, onboarding_version_seen)
on table public.profiles
to authenticated;

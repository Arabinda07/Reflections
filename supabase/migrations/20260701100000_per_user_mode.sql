-- Migration: Add per-user mode column and rewrite zero_knowledge_is_forced()
-- ADR: docs/adr/0001-per-user-encryption-ai-mode.md
--
-- Adds user_mode ('encrypted' | 'reflective') to profiles.
-- Existing users default to 'reflective' (small user base, matches current
-- experience where AI features are available and encryption is not enforced).
-- Rewrites zero_knowledge_is_forced() to inspect the calling user's profile
-- row instead of the global zero_knowledge_enforcement singleton. The existing
-- CHECK constraints on notes, mood_checkins, future_letters, life_themes,
-- relationships, and relationship_import_inbox remain unchanged — they already
-- call zero_knowledge_is_forced() through a security definer function, so
-- swapping the function body is sufficient.

begin;

-- 1. Add user_mode column
alter table public.profiles
  add column if not exists user_mode text not null default 'reflective'
    check (user_mode in ('encrypted', 'reflective'));

comment on column public.profiles.user_mode is
  'Permanent per-user mode chosen at onboarding. encrypted = zero-knowledge vault, reflective = plaintext for AI processing. Cannot be changed by the user after account creation.';

-- 2. Rewrite zero_knowledge_is_forced() to be per-user
create or replace function public.zero_knowledge_is_forced()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select user_mode = 'encrypted' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- 3. Server-owned function for onboarding to set user_mode exactly once.
-- The client cannot UPDATE profiles.user_mode directly (column is excluded
-- from column-level grants). This function enforces the one-time write:
-- it only succeeds when user_mode is still the default 'reflective' value
-- (for new users) or when the user has not yet been onboarded.
create or replace function public.set_user_mode(mode text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if mode not in ('encrypted', 'reflective') then
    raise exception 'Invalid user_mode: %', mode;
  end if;

  -- Only allow setting the mode when the user has not yet completed onboarding.
  -- This enforces the "locked at account creation" rule from ADR 0001.
  update public.profiles
  set user_mode = mode,
      onboarding_completed_at = now(),
      updated_at = now()
  where id = auth.uid()
    and onboarding_completed_at is null;

  if not found then
    raise exception 'User mode has already been set and cannot be changed';
  end if;
end;
$$;

-- 4. Backfill onboarding_completed_at for existing users
-- All existing users are defaulted to 'reflective' and bypass the new mode select screen.
update public.profiles
set onboarding_completed_at = now()
where onboarding_completed_at is null;

comment on function public.set_user_mode(text) is
  'One-time onboarding function to set the user mode. Called from the /onboarding/mode-select screen.';

commit;

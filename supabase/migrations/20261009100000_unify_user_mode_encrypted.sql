-- Migration: Unify all users under client-side zero-knowledge encryption
-- ADR: docs/adr/0004-local-embeddings-and-unified-encryption-architecture.md
--
-- Supersedes the per-user mode bifurcation from ADR 0001.
-- All users operate in zero-knowledge encrypted vault mode with client-side
-- AES-GCM 256-bit encryption. AI features run locally or behind the Pro paywall.

begin;

-- 1. Default user_mode to 'encrypted' for all new profile rows
alter table public.profiles
  alter column user_mode set default 'encrypted';

-- 2. Backfill all existing reflective profiles to encrypted
update public.profiles
set user_mode = 'encrypted',
    updated_at = now()
where user_mode = 'reflective';

-- 3. Update zero_knowledge_is_forced to always enforce encryption
create or replace function public.zero_knowledge_is_forced()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select true;
$$;

comment on column public.profiles.user_mode is
  'Unified account mode. All users operate in zero-knowledge encrypted mode with client-side WebCrypto.';

commit;

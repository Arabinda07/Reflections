-- Reflections launch security lockdown
-- Apply externally in the Supabase SQL editor or via `psql` against production.
-- This file is intentionally idempotent: it can be re-run after review.

begin;

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Profiles: remove public read, keep user-editable fields column-scoped only.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own editable profile fields" on public.profiles;

create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) is not null and id = (select auth.uid()));

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and id = (select auth.uid()));

create policy "Users can update own editable profile fields"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) is not null and id = (select auth.uid()))
  with check ((select auth.uid()) is not null and id = (select auth.uid()));

revoke select on table public.profiles from anon;
revoke insert on table public.profiles from anon, authenticated;
revoke update on table public.profiles from anon, authenticated;
revoke update on table public.profiles from authenticated;
revoke delete on table public.profiles from anon, authenticated;

grant select (
  id,
  full_name,
  avatar_url,
  newsletter_opt_in,
  smart_mode_enabled,
  updated_at
) on table public.profiles to authenticated;

grant insert (
  id,
  full_name,
  avatar_url,
  newsletter_opt_in,
  smart_mode_enabled
) on table public.profiles to authenticated;

grant update (
  full_name,
  avatar_url,
  newsletter_opt_in,
  smart_mode_enabled,
  updated_at
) on table public.profiles to authenticated;

-- Legacy privileged profile columns are left in place for rollback safety, but
-- direct browser writes are blocked by the column privileges above. New code
-- reads entitlements and usage from the server-owned tables below.

-- ---------------------------------------------------------------------------
-- Server-owned entitlement, AI usage, and billing records.
-- ---------------------------------------------------------------------------

create table if not exists public.account_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  pro_status text not null default 'inactive',
  razorpay_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.account_entitlements (user_id, plan, created_at, updated_at)
select id, coalesce(nullif(plan, ''), 'free'), now(), now()
from public.profiles
on conflict (user_id) do update
set plan = excluded.plan,
    updated_at = now();

alter table public.account_entitlements enable row level security;

drop policy if exists "Users can view own entitlements" on public.account_entitlements;
create policy "Users can view own entitlements"
  on public.account_entitlements
  for select
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

revoke all on table public.account_entitlements from anon, authenticated;
grant select on table public.account_entitlements to authenticated;

create table if not exists public.ai_usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  period_start date not null,
  used integer not null default 0 check (used >= 0),
  max_allowed integer not null check (max_allowed >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, action, period_start)
);

alter table public.ai_usage_counters enable row level security;

drop policy if exists "Users can view own AI usage counters" on public.ai_usage_counters;
create policy "Users can view own AI usage counters"
  on public.ai_usage_counters
  for select
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

revoke all on table public.ai_usage_counters from anon, authenticated;
grant select on table public.ai_usage_counters to authenticated;

create table if not exists public.ai_rate_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  action text not null,
  ip_hash text,
  allowed boolean not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_rate_events_user_action_created_at
  on public.ai_rate_events (user_id, action, created_at desc);

create index if not exists idx_ai_rate_events_ip_action_created_at
  on public.ai_rate_events (ip_hash, action, created_at desc);

alter table public.ai_rate_events enable row level security;

drop policy if exists "Users can view own AI rate events" on public.ai_rate_events;
create policy "Users can view own AI rate events"
  on public.ai_rate_events
  for select
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

revoke all on table public.ai_rate_events from anon, authenticated;
grant select on table public.ai_rate_events to authenticated;

create table if not exists public.razorpay_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null check (plan_code in ('monthly', 'yearly')),
  razorpay_plan_id text not null,
  razorpay_subscription_id text not null unique,
  status text not null default 'created',
  checkout_signature_verified_at timestamptz,
  current_period_end timestamptz,
  last_payment_id text,
  last_webhook_event text,
  newsletter_opt_in boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_razorpay_subscriptions_user_id
  on public.razorpay_subscriptions (user_id);

alter table public.razorpay_subscriptions enable row level security;

drop policy if exists "Users can view own Razorpay subscriptions" on public.razorpay_subscriptions;
create policy "Users can view own Razorpay subscriptions"
  on public.razorpay_subscriptions
  for select
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

revoke all on table public.razorpay_subscriptions from anon, authenticated;
grant select on table public.razorpay_subscriptions to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic AI quota claim. Callable only by service-role backend code.
-- ---------------------------------------------------------------------------

create or replace function public.claim_ai_usage(
  p_user_id uuid,
  p_action text,
  p_ip_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan text;
  v_period_start date := date_trunc('month', now())::date;
  v_month_limit integer;
  v_hour_user_limit integer;
  v_hour_ip_limit integer;
  v_used integer;
begin
  if p_user_id is null then
    return jsonb_build_object('allowed', false, 'reason', 'missing_user');
  end if;

  if p_action not in (
    'prompts',
    'reflection',
    'tags',
    'ingestDecision',
    'ingestSynthesis',
    'wikiPage',
    'index',
    'writingNotes'
  ) then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_action');
  end if;

  select coalesce(plan, 'free')
  into v_plan
  from public.account_entitlements
  where user_id = p_user_id;

  v_plan := coalesce(v_plan, 'free');

  v_month_limit := case
    when v_plan = 'pro' then
      case
        when p_action in ('wikiPage', 'ingestSynthesis', 'ingestDecision', 'index') then 300
        else 500
      end
    else
      case p_action
        when 'reflection' then 1
        when 'wikiPage' then 6
        when 'index' then 2
        when 'ingestDecision' then 6
        when 'ingestSynthesis' then 6
        when 'prompts' then 20
        when 'tags' then 30
        when 'writingNotes' then 20
        else 0
      end
  end;

  v_hour_user_limit := case
    when p_action in ('wikiPage', 'ingestSynthesis', 'ingestDecision', 'index') then 30
    else 60
  end;

  v_hour_ip_limit := v_hour_user_limit * 3;

  if (
    select count(*)
    from public.ai_rate_events
    where user_id = p_user_id
      and action = p_action
      and allowed is true
      and created_at > now() - interval '1 hour'
  ) >= v_hour_user_limit then
    insert into public.ai_rate_events (user_id, action, ip_hash, allowed, reason)
    values (p_user_id, p_action, p_ip_hash, false, 'per_user_hourly_rate_limit');

    return jsonb_build_object('allowed', false, 'reason', 'per_user_hourly_rate_limit');
  end if;

  if p_ip_hash is not null and (
    select count(*)
    from public.ai_rate_events
    where ip_hash = p_ip_hash
      and action = p_action
      and allowed is true
      and created_at > now() - interval '1 hour'
  ) >= v_hour_ip_limit then
    insert into public.ai_rate_events (user_id, action, ip_hash, allowed, reason)
    values (p_user_id, p_action, p_ip_hash, false, 'per_ip_hourly_rate_limit');

    return jsonb_build_object('allowed', false, 'reason', 'per_ip_hourly_rate_limit');
  end if;

  insert into public.ai_usage_counters (
    user_id,
    action,
    period_start,
    used,
    max_allowed,
    created_at,
    updated_at
  )
  values (
    p_user_id,
    p_action,
    v_period_start,
    1,
    v_month_limit,
    now(),
    now()
  )
  on conflict (user_id, action, period_start)
  do update
    set used = public.ai_usage_counters.used + 1,
        max_allowed = excluded.max_allowed,
        updated_at = now()
    where public.ai_usage_counters.used < excluded.max_allowed
  returning used into v_used;

  if v_used is null then
    insert into public.ai_rate_events (user_id, action, ip_hash, allowed, reason)
    values (p_user_id, p_action, p_ip_hash, false, 'monthly_quota_exhausted');

    return jsonb_build_object(
      'allowed', false,
      'reason', 'monthly_quota_exhausted',
      'limit', v_month_limit,
      'plan', v_plan
    );
  end if;

  insert into public.ai_rate_events (user_id, action, ip_hash, allowed)
  values (p_user_id, p_action, p_ip_hash, true);

  return jsonb_build_object(
    'allowed', true,
    'used', v_used,
    'limit', v_month_limit,
    'plan', v_plan
  );
end;
$$;

revoke execute on function public.claim_ai_usage(uuid, text, text) from public, anon, authenticated;
grant execute on function public.claim_ai_usage(uuid, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Private data RLS tightening and ownership cross-checks.
-- ---------------------------------------------------------------------------

alter table public.notes enable row level security;

alter table public.notes
  add column if not exists server_created_at timestamptz not null default now();

drop policy if exists "Users can view their own notes" on public.notes;
drop policy if exists "Users can insert their own notes" on public.notes;
drop policy if exists "Users can update their own notes" on public.notes;
drop policy if exists "Users can delete their own notes" on public.notes;

create policy "Users can view their own notes"
  on public.notes
  for select
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "Users can insert their own notes"
  on public.notes
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "Users can update their own notes"
  on public.notes
  for update
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "Users can delete their own notes"
  on public.notes
  for delete
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create or replace function public.enforce_note_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_plan text;
  note_count integer;
begin
  select coalesce(plan, 'free')
  into user_plan
  from public.account_entitlements
  where user_id = new.user_id;

  user_plan := coalesce(user_plan, 'free');

  if user_plan <> 'pro' then
    select count(*)
    into note_count
    from public.notes
    where user_id = new.user_id
      and server_created_at >= date_trunc('month', now());

    if note_count >= 30 then
      raise exception 'Free plan monthly note limit reached';
    end if;
  end if;

  new.server_created_at := coalesce(new.server_created_at, now());
  return new;
end;
$$;

drop trigger if exists tr_enforce_note_limit on public.notes;
create trigger tr_enforce_note_limit
  before insert on public.notes
  for each row execute function public.enforce_note_limit();

alter table public.theme_citations enable row level security;

drop policy if exists "Users can insert citations for own themes" on public.theme_citations;
create policy "Users can insert citations for own themes and notes"
  on public.theme_citations
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.life_themes
      where life_themes.id = theme_citations.theme_id
        and life_themes.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.notes
      where notes.id = theme_citations.note_id
        and notes.user_id = (select auth.uid())
    )
  );

alter table public.wiki_absorb_log enable row level security;

drop policy if exists "Users can insert their own absorb log" on public.wiki_absorb_log;
create policy "Users can insert own absorb log for own notes"
  on public.wiki_absorb_log
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and exists (
      select 1
      from public.notes
      where notes.id = wiki_absorb_log.note_id
        and notes.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update their own absorb log" on public.wiki_absorb_log;
create policy "Users can update own absorb log for own notes"
  on public.wiki_absorb_log
  for update
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and exists (
      select 1
      from public.notes
      where notes.id = wiki_absorb_log.note_id
        and notes.user_id = (select auth.uid())
    )
  );

drop policy if exists "Referred users can record accepted referrals" on public.referrals;
revoke insert, update, delete on table public.referrals from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket lockdown. Also configure dashboard-equivalent limits in SQL.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'app-files',
  'app-files',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'audio/aac',
    'audio/m4a',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'text/plain'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view own files" on storage.objects;
drop policy if exists "Users can upload to own folder" on storage.objects;
drop policy if exists "Users can update own files" on storage.objects;
drop policy if exists "Users can delete own files" on storage.objects;

create policy "Users can view own files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'app-files'
    and name like (auth.uid()::text || '/%')
  );

create policy "Users can upload to own folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'app-files'
    and name like (auth.uid()::text || '/%')
  );

create policy "Users can delete own files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'app-files'
    and name like (auth.uid()::text || '/%')
  );

-- ---------------------------------------------------------------------------
-- Harden exposed security-definer functions.
-- ---------------------------------------------------------------------------

create or replace function public.delete_user_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.wiki_absorb_log where user_id = auth.uid();
  delete from public.theme_citations
  where exists (
    select 1
    from public.life_themes
    where life_themes.id = theme_citations.theme_id
      and life_themes.user_id = auth.uid()
  );
  delete from public.life_themes where user_id = auth.uid();
  delete from public.mood_checkins where user_id = auth.uid();
  delete from public.future_letters where user_id = auth.uid();
  delete from public.ritual_events where user_id = auth.uid();
  delete from public.referrals where inviter_user_id = auth.uid() or referred_user_id = auth.uid();
  delete from public.referral_invites where user_id = auth.uid();
  delete from public.notes where user_id = auth.uid();
  delete from public.account_entitlements where user_id = auth.uid();
  delete from public.ai_usage_counters where user_id = auth.uid();
  delete from public.ai_rate_events where user_id = auth.uid();
  delete from public.razorpay_subscriptions where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
end;
$$;

revoke execute on function public.delete_user_data() from public, anon;
grant execute on function public.delete_user_data() to authenticated;

notify pgrst, 'reload schema';

commit;

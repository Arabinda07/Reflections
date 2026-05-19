-- ============================================================
-- Reflections — Supabase Schema Update
-- ============================================================
-- Run this script in the Supabase SQL Editor to apply updates
-- for Razorpay integration (newsletter opt-in and pro plan logic).
-- ============================================================

-- 1. Add newsletter_opt_in column to profiles if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'newsletter_opt_in'
  ) then
    alter table profiles add column newsletter_opt_in boolean default false;
  end if;
end $$;

-- 1b. Add newsletter_unsubscribed_at column to profiles if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'newsletter_unsubscribed_at'
  ) then
    alter table profiles add column newsletter_unsubscribed_at timestamptz;
  end if;
end $$;

-- 2. Add smart_mode_enabled column to profiles if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'smart_mode_enabled'
  ) then
    alter table profiles add column smart_mode_enabled boolean default false;
  end if;
end $$;

-- 2b. Preserve signup newsletter opt-ins on the profile row created by auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, newsletter_opt_in)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce((new.raw_user_meta_data->>'newsletter_opt_in')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer;

-- 3. Add the Smart Mode absorb log used to skip unchanged notes
create table if not exists wiki_absorb_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  note_id uuid references notes(id) on delete cascade not null,
  content_hash text not null,
  absorbed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, note_id)
);

alter table wiki_absorb_log enable row level security;

drop policy if exists "Users can view their own absorb log" on wiki_absorb_log;
create policy "Users can view their own absorb log"
  on wiki_absorb_log for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own absorb log" on wiki_absorb_log;
create policy "Users can insert their own absorb log"
  on wiki_absorb_log for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own absorb log" on wiki_absorb_log;
create policy "Users can update their own absorb log"
  on wiki_absorb_log for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own absorb log" on wiki_absorb_log;
create policy "Users can delete their own absorb log"
  on wiki_absorb_log for delete using (auth.uid() = user_id);

-- 4. Add durable AI run ledger and feature-level usage counters
create table if not exists account_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  pro_status text not null default 'inactive',
  razorpay_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into account_entitlements (user_id, plan, created_at, updated_at)
select id, coalesce(nullif(plan, ''), 'free'), now(), now()
from profiles
on conflict (user_id) do nothing;

alter table account_entitlements enable row level security;

drop policy if exists "Users can view own entitlements" on account_entitlements;
create policy "Users can view own entitlements"
  on account_entitlements for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists ai_feature_usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('reflection', 'life_wiki_refresh')),
  period_start date not null,
  used integer not null default 0 check (used >= 0),
  max_allowed integer not null check (max_allowed >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, feature, period_start)
);

alter table ai_feature_usage_counters enable row level security;

drop policy if exists "Users can view own AI feature usage counters" on ai_feature_usage_counters;
create policy "Users can view own AI feature usage counters"
  on ai_feature_usage_counters for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists ai_runs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  kind text not null check (kind in ('life_wiki_refresh', 'reflection')),
  trigger text not null default 'manual',
  status text not null default 'running' check (status in ('running', 'succeeded', 'partial', 'failed', 'skipped')),
  source_note_ids text[] not null default '{}',
  source_hash text,
  prompt_version text,
  model text,
  page_count integer not null default 0 check (page_count >= 0),
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_runs_user_created_at
  on ai_runs (user_id, created_at desc);

alter table ai_runs enable row level security;

drop policy if exists "Users can view own AI runs" on ai_runs;
create policy "Users can view own AI runs"
  on ai_runs for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists ai_run_events (
  id uuid default gen_random_uuid() primary key,
  run_id uuid references ai_runs(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null,
  page_type text,
  status text,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_run_events_run_created_at
  on ai_run_events (run_id, created_at);

alter table ai_run_events enable row level security;

drop policy if exists "Users can view own AI run events" on ai_run_events;
create policy "Users can view own AI run events"
  on ai_run_events for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.claim_ai_feature_usage(
  p_user_id uuid,
  p_feature text
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
  v_used integer;
begin
  if p_user_id is null then
    return jsonb_build_object('allowed', false, 'reason', 'missing_user');
  end if;

  if p_feature not in ('reflection', 'life_wiki_refresh') then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_feature');
  end if;

  select coalesce(plan, 'free')
  into v_plan
  from public.account_entitlements
  where user_id = p_user_id;

  v_plan := coalesce(v_plan, 'free');

  v_month_limit := case
    when v_plan = 'pro' then
      case p_feature
        when 'life_wiki_refresh' then 60
        else 500
      end
    else 1
  end;

  insert into public.ai_feature_usage_counters (
    user_id,
    feature,
    period_start,
    used,
    max_allowed,
    created_at,
    updated_at
  )
  values (
    p_user_id,
    p_feature,
    v_period_start,
    1,
    v_month_limit,
    now(),
    now()
  )
  on conflict (user_id, feature, period_start)
  do update
    set used = public.ai_feature_usage_counters.used + 1,
        max_allowed = excluded.max_allowed,
        updated_at = now()
    where public.ai_feature_usage_counters.used < excluded.max_allowed
  returning used into v_used;

  if v_used is null then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'monthly_feature_quota_exhausted',
      'limit', v_month_limit,
      'plan', v_plan
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'used', v_used,
    'limit', v_month_limit,
    'plan', v_plan
  );
end;
$$;

revoke execute on function public.claim_ai_feature_usage(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_ai_feature_usage(uuid, text) to service_role;

-- 5. Update the enforce_note_limit function to bypass limits for 'pro' plan users
create or replace function enforce_note_limit()
returns trigger as $$
declare
  note_count int;
  user_plan text;
begin
  -- Fetch the user's current plan
  select plan into user_plan from profiles where id = new.user_id;
  
  -- If the user is on the 'pro' plan, allow unlimited notes
  if user_plan = 'pro' then
    return new;
  end if;

  -- Otherwise, enforce the 30 notes/month limit
  select count(*) into note_count
  from notes
  where user_id = new.user_id
    and created_at >= date_trunc('month', now());

  if note_count >= 30 then
    raise exception 'FREE_LIMIT_REACHED';
  end if;
  
  return new;
end;
$$ language plpgsql;

-- 6. Engagement layer tables
create table if not exists mood_checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  mood text not null,
  label text,
  source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table mood_checkins enable row level security;

drop policy if exists "Users can view their own mood check-ins" on mood_checkins;
create policy "Users can view their own mood check-ins"
  on mood_checkins for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own mood check-ins" on mood_checkins;
create policy "Users can insert their own mood check-ins"
  on mood_checkins for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own mood check-ins" on mood_checkins;
create policy "Users can delete their own mood check-ins"
  on mood_checkins for delete using (auth.uid() = user_id);

create table if not exists future_letters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default '',
  content text default '',
  open_at timestamp with time zone not null,
  opened_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'scheduled' check (status in ('scheduled', 'opened', 'archived'))
);

alter table future_letters enable row level security;

drop policy if exists "Users can view their own future letters" on future_letters;
create policy "Users can view their own future letters"
  on future_letters for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own future letters" on future_letters;
create policy "Users can insert their own future letters"
  on future_letters for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own future letters" on future_letters;
create policy "Users can update their own future letters"
  on future_letters for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own future letters" on future_letters;
create policy "Users can delete their own future letters"
  on future_letters for delete using (auth.uid() = user_id);

create table if not exists ritual_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null check (event_type in ('release_completed', 'letter_scheduled', 'letter_opened', 'completion_card_created')),
  source_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table ritual_events enable row level security;

drop policy if exists "Users can view their own ritual events" on ritual_events;
create policy "Users can view their own ritual events"
  on ritual_events for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own ritual events" on ritual_events;
create policy "Users can insert their own ritual events"
  on ritual_events for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own ritual events" on ritual_events;
create policy "Users can delete their own ritual events"
  on ritual_events for delete using (auth.uid() = user_id);

create table if not exists referral_invites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  code text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_shared_at timestamp with time zone,
  unique(user_id)
);

alter table referral_invites enable row level security;

drop policy if exists "Users can view their own referral invite" on referral_invites;
create policy "Users can view their own referral invite"
  on referral_invites for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own referral invite" on referral_invites;
create policy "Users can insert their own referral invite"
  on referral_invites for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own referral invite" on referral_invites;
create policy "Users can update their own referral invite"
  on referral_invites for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own referral invite" on referral_invites;
create policy "Users can delete their own referral invite"
  on referral_invites for delete using (auth.uid() = user_id);

create table if not exists referrals (
  id uuid default gen_random_uuid() primary key,
  inviter_user_id uuid references auth.users(id) on delete cascade not null,
  referred_user_id uuid references auth.users(id) on delete cascade not null unique,
  code text not null,
  accepted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(inviter_user_id, referred_user_id)
);

alter table referrals enable row level security;

drop policy if exists "Users can view referrals they are part of" on referrals;
create policy "Users can view referrals they are part of"
  on referrals for select using (auth.uid() = inviter_user_id or auth.uid() = referred_user_id);

drop policy if exists "Referred users can record accepted referrals" on referrals;
create policy "Referred users can record accepted referrals"
  on referrals for insert with check (auth.uid() = referred_user_id and inviter_user_id <> auth.uid());

create or replace function public.accept_referral_invite(referral_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inviter_id uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  select user_id into inviter_id
  from public.referral_invites
  where code = referral_code
  limit 1;

  if inviter_id is null or inviter_id = auth.uid() then
    return false;
  end if;

  insert into public.referrals (inviter_user_id, referred_user_id, code)
  values (inviter_id, auth.uid(), referral_code)
  on conflict (referred_user_id) do nothing;

  return true;
end;
$$;

grant execute on function public.accept_referral_invite(text) to authenticated;

-- 7. Keep the Account data deletion helper in sync with engagement and AI data
create or replace function delete_user_data()
returns void as $$
begin
  delete from public.wiki_absorb_log where user_id = auth.uid();
  delete from public.ai_run_events where user_id = auth.uid();
  delete from public.ai_runs where user_id = auth.uid();
  delete from public.ai_feature_usage_counters where user_id = auth.uid();
  delete from public.account_entitlements where user_id = auth.uid();
  delete from public.theme_citations
    where theme_id in (select id from public.life_themes where user_id = auth.uid());
  delete from public.life_themes where user_id = auth.uid();
  delete from public.mood_checkins where user_id = auth.uid();
  delete from public.future_letters where user_id = auth.uid();
  delete from public.ritual_events where user_id = auth.uid();
  delete from public.referrals where inviter_user_id = auth.uid() or referred_user_id = auth.uid();
  delete from public.referral_invites where user_id = auth.uid();
  delete from public.notes where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
end;
$$ language plpgsql security definer;

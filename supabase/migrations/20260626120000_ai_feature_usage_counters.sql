-- Backfill the monthly free-AI quota table + claim function into the managed
-- migration pipeline. Previously these lived only in the hand-run root scripts
-- (supabase_security_lockdown.sql), so databases that never had those scripts
-- applied are missing `ai_feature_usage_counters` — which makes the Life Wiki
-- refresh quota RPC (claim_ai_feature_usage) error out (HTTP 500) and the
-- client-side free-usage counts read as 0. This migration is idempotent and is
-- a no-op where the objects already exist.

create table if not exists public.ai_feature_usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('reflection', 'life_wiki_refresh')),
  period_start date not null,
  used integer not null default 0 check (used >= 0),
  max_allowed integer not null check (max_allowed >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, feature, period_start)
);

alter table public.ai_feature_usage_counters enable row level security;

drop policy if exists "Users can view own AI feature usage counters" on public.ai_feature_usage_counters;
create policy "Users can view own AI feature usage counters"
  on public.ai_feature_usage_counters
  for select
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

revoke all on table public.ai_feature_usage_counters from anon, authenticated;
grant select on table public.ai_feature_usage_counters to authenticated;

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

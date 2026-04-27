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

-- 2. Update the enforce_note_limit function to bypass limits for 'pro' plan users
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

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

-- 4. Update the enforce_note_limit function to bypass limits for 'pro' plan users
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

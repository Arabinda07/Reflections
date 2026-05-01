-- ============================================================
-- Reflections — Complete Supabase Schema (v1.0.0)
-- ============================================================
-- Run this in the Supabase SQL Editor to ensure all tables,
-- columns, policies, triggers, and functions match the app code.
--
-- SAFE TO RE-RUN: Uses IF NOT EXISTS and DROP IF EXISTS.
-- ============================================================


-- ─────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  plan text default 'free',
  newsletter_opt_in boolean default false,
  free_ai_reflections_used int default 0,
  free_wiki_insights_used int default 0,
  smart_mode_enabled boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table profiles enable row level security;

-- Policies (idempotent via DROP + CREATE)
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select using (true);

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update using (auth.uid() = id);


-- ─────────────────────────────────────────────
-- 2. NOTES
-- ─────────────────────────────────────────────

create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default '',
  content text default '',
  mood text,
  thumbnail_url text,
  tags text[] default '{}',
  attachments jsonb default '[]',
  tasks jsonb default '[]',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table notes enable row level security;

drop policy if exists "Users can view their own notes" on notes;
create policy "Users can view their own notes"
  on notes for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own notes" on notes;
create policy "Users can insert their own notes"
  on notes for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own notes" on notes;
create policy "Users can update their own notes"
  on notes for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own notes" on notes;
create policy "Users can delete their own notes"
  on notes for delete using (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 3. LIFE THEMES (Wiki)
-- ─────────────────────────────────────────────
-- Used by wikiService.ts for both freeform "themes"
-- and structured wiki pages (mood_patterns, etc.)

create table if not exists life_themes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text default '',
  state text default 'active' check (state in ('active', 'archived', 'resolved')),
  page_type text default 'theme' check (page_type in ('theme', 'people', 'patterns', 'philosophies', 'eras', 'decisions', 'mood_patterns', 'recurring_themes', 'self_model', 'timeline', 'index')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table life_themes enable row level security;

drop policy if exists "Users can view their own themes" on life_themes;
create policy "Users can view their own themes"
  on life_themes for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own themes" on life_themes;
create policy "Users can insert their own themes"
  on life_themes for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own themes" on life_themes;
create policy "Users can update their own themes"
  on life_themes for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own themes" on life_themes;
create policy "Users can delete their own themes"
  on life_themes for delete using (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 4. THEME CITATIONS (Note ↔ Theme links)
-- ─────────────────────────────────────────────

create table if not exists theme_citations (
  id uuid default gen_random_uuid() primary key,
  theme_id uuid references life_themes(id) on delete cascade not null,
  note_id uuid references notes(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(theme_id, note_id)
);

alter table theme_citations enable row level security;

-- Citations are readable if the user owns the linked theme
drop policy if exists "Users can view citations for own themes" on theme_citations;
create policy "Users can view citations for own themes"
  on theme_citations for select
  using (
    exists (
      select 1 from life_themes
      where life_themes.id = theme_citations.theme_id
        and life_themes.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert citations for own themes" on theme_citations;
create policy "Users can insert citations for own themes"
  on theme_citations for insert
  with check (
    exists (
      select 1 from life_themes
      where life_themes.id = theme_citations.theme_id
        and life_themes.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete citations for own themes" on theme_citations;
create policy "Users can delete citations for own themes"
  on theme_citations for delete
  using (
    exists (
      select 1 from life_themes
      where life_themes.id = theme_citations.theme_id
        and life_themes.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────
-- 4b. WIKI ABSORB LOG (Smart Mode hash tracking)
-- ─────────────────────────────────────────────

create table if not exists wiki_absorb_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
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


-- ─────────────────────────────────────────────
-- 5. ENGAGEMENT LAYER
-- ─────────────────────────────────────────────

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


-- ─────────────────────────────────────────────
-- 6. STORAGE POLICIES (app-files bucket)
-- ─────────────────────────────────────────────
-- Assumes the bucket 'app-files' already exists.
-- Create it manually in Supabase Dashboard → Storage if not.

drop policy if exists "Users can view own files" on storage.objects;
create policy "Users can view own files"
  on storage.objects for select to authenticated
  using (bucket_id = 'app-files' and name like (auth.uid()::text || '/%'));

drop policy if exists "Users can upload to own folder" on storage.objects;
create policy "Users can upload to own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'app-files' and name like (auth.uid()::text || '/%'));

drop policy if exists "Users can update own files" on storage.objects;
create policy "Users can update own files"
  on storage.objects for update to authenticated
  using (bucket_id = 'app-files' and name like (auth.uid()::text || '/%'));

drop policy if exists "Users can delete own files" on storage.objects;
create policy "Users can delete own files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'app-files' and name like (auth.uid()::text || '/%'));


-- ─────────────────────────────────────────────
-- 7. TRIGGERS & FUNCTIONS
-- ─────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6b. Free-tier note limit (30 notes/month)
create or replace function enforce_note_limit()
returns trigger as $$
declare
  note_count int;
  user_plan text;
begin
  select plan into user_plan from profiles where id = new.user_id;
  if user_plan = 'pro' then
    return new;
  end if;

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

drop trigger if exists tr_enforce_note_limit on notes;
create trigger tr_enforce_note_limit
  before insert on notes
  for each row execute function enforce_note_limit();

-- 6c. Delete all user data (called from Account page)
create or replace function delete_user_data()
returns void as $$
begin
  delete from public.wiki_absorb_log where user_id = auth.uid();
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


-- ─────────────────────────────────────────────
-- 8. MIGRATION HELPERS
-- ─────────────────────────────────────────────
-- If tables already exist but are missing columns,
-- these will add them safely.

do $$
begin
  -- Add tasks column to notes if missing
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'notes' and column_name = 'tasks'
  ) then
    alter table notes add column tasks jsonb default '[]';
  end if;

  -- Add page_type column to life_themes if missing
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'life_themes' and column_name = 'page_type'
  ) then
    alter table life_themes add column page_type text default 'theme';
  end if;

  -- Add newsletter_opt_in column to profiles if missing
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'newsletter_opt_in'
  ) then
    alter table profiles add column newsletter_opt_in boolean default false;
  end if;

  -- Add smart_mode_enabled column to profiles if missing
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'smart_mode_enabled'
  ) then
    alter table profiles add column smart_mode_enabled boolean default false;
  end if;
end $$;

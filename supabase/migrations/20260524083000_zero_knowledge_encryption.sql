begin;

create table if not exists public.user_encryption_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  key_id uuid not null,
  unlock_method text not null default 'private_writing_password'
    check (unlock_method in ('account_password', 'private_writing_password')),
  account_password_wrapper jsonb,
  passphrase_wrapper jsonb not null,
  recovery_wrapper jsonb not null,
  wrapper_version integer not null default 1,
  kdf_calibration jsonb not null default '{}'::jsonb,
  migration_state text not null default 'pending'
    check (migration_state in ('pending', 'migrating', 'verified', 'plaintext_cleared', 'reset')),
  recovery_verified_at timestamptz,
  encryption_setup_completed_at timestamptz,
  last_rewrapped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_encryption_keys
  add column if not exists unlock_method text not null default 'private_writing_password'
    check (unlock_method in ('account_password', 'private_writing_password')),
  add column if not exists account_password_wrapper jsonb,
  add column if not exists wrapper_version integer not null default 1,
  add column if not exists recovery_verified_at timestamptz,
  add column if not exists encryption_setup_completed_at timestamptz,
  add column if not exists last_rewrapped_at timestamptz;

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_version_seen integer;

alter table public.user_encryption_keys enable row level security;

drop policy if exists "Users can view their own encryption key bundle" on public.user_encryption_keys;
create policy "Users can view their own encryption key bundle"
  on public.user_encryption_keys
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own encryption key bundle" on public.user_encryption_keys;
create policy "Users can create their own encryption key bundle"
  on public.user_encryption_keys
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own encryption key bundle" on public.user_encryption_keys;
create policy "Users can update their own encryption key bundle"
  on public.user_encryption_keys
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.touch_user_encryption_keys_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_encryption_keys_updated_at on public.user_encryption_keys;
create trigger user_encryption_keys_updated_at
  before update on public.user_encryption_keys
  for each row
  execute function public.touch_user_encryption_keys_updated_at();

alter table public.notes
  add column if not exists encrypted_payload jsonb,
  add column if not exists encrypted_payload_version integer not null default 1,
  add column if not exists encryption_migration_state text not null default 'pending'
    check (encryption_migration_state in ('pending', 'migrating', 'verified', 'plaintext_cleared'));

alter table public.mood_checkins
  add column if not exists encrypted_payload jsonb,
  add column if not exists encrypted_payload_version integer not null default 1,
  add column if not exists encryption_migration_state text not null default 'pending'
    check (encryption_migration_state in ('pending', 'migrating', 'verified', 'plaintext_cleared'));

alter table public.mood_checkins
  alter column mood drop not null;

alter table public.future_letters
  add column if not exists encrypted_payload jsonb,
  add column if not exists encrypted_payload_version integer not null default 1,
  add column if not exists encryption_migration_state text not null default 'pending'
    check (encryption_migration_state in ('pending', 'migrating', 'verified', 'plaintext_cleared'));

alter table public.life_themes
  add column if not exists encrypted_payload jsonb,
  add column if not exists encrypted_payload_version integer not null default 1,
  add column if not exists encryption_migration_state text not null default 'pending'
    check (encryption_migration_state in ('pending', 'migrating', 'verified', 'plaintext_cleared'));

create index if not exists notes_user_encrypted_payload_idx
  on public.notes (user_id)
  where encrypted_payload is not null;

create index if not exists mood_checkins_user_encrypted_payload_idx
  on public.mood_checkins (user_id)
  where encrypted_payload is not null;

create index if not exists future_letters_user_encrypted_payload_idx
  on public.future_letters (user_id)
  where encrypted_payload is not null;

create index if not exists life_themes_user_encrypted_payload_idx
  on public.life_themes (user_id)
  where encrypted_payload is not null;

create table if not exists public.zero_knowledge_enforcement (
  id boolean primary key default true check (id),
  force_zero_knowledge_encryption boolean not null default false,
  block_legacy_clients boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.zero_knowledge_enforcement (id, force_zero_knowledge_encryption, block_legacy_clients)
values (true, false, false)
on conflict (id) do nothing;

alter table public.zero_knowledge_enforcement enable row level security;

drop policy if exists "Authenticated users can read zero knowledge enforcement" on public.zero_knowledge_enforcement;
create policy "Authenticated users can read zero knowledge enforcement"
  on public.zero_knowledge_enforcement
  for select
  to authenticated
  using (true);

create or replace function public.zero_knowledge_is_forced()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select force_zero_knowledge_encryption from public.zero_knowledge_enforcement where id = true),
    false
  );
$$;

alter table public.notes
  drop constraint if exists notes_zero_knowledge_payload_required,
  add constraint notes_zero_knowledge_payload_required
    check (public.zero_knowledge_is_forced() = false or encrypted_payload is not null) not valid;

alter table public.mood_checkins
  drop constraint if exists mood_checkins_zero_knowledge_payload_required,
  add constraint mood_checkins_zero_knowledge_payload_required
    check (public.zero_knowledge_is_forced() = false or encrypted_payload is not null) not valid;

alter table public.future_letters
  drop constraint if exists future_letters_zero_knowledge_payload_required,
  add constraint future_letters_zero_knowledge_payload_required
    check (public.zero_knowledge_is_forced() = false or encrypted_payload is not null) not valid;

alter table public.life_themes
  drop constraint if exists life_themes_zero_knowledge_payload_required,
  add constraint life_themes_zero_knowledge_payload_required
    check (public.zero_knowledge_is_forced() = false or encrypted_payload is not null) not valid;

comment on table public.user_encryption_keys is
  'Stores wrapped data-encryption keys only. The plaintext data key and passphrase are never stored server-side.';

comment on column public.notes.encrypted_payload is
  'Zero-knowledge encrypted note fields: title, content, mood, tags, tasks, attachments, thumbnail metadata.';

comment on column public.mood_checkins.encrypted_payload is
  'Zero-knowledge encrypted mood details: mood, label, source.';

comment on column public.future_letters.encrypted_payload is
  'Zero-knowledge encrypted letter fields: title and content. open_at remains operational plaintext.';

comment on column public.life_themes.encrypted_payload is
  'Zero-knowledge encrypted Life Wiki fields: title and content.';

commit;

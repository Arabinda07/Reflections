begin;

create table if not exists public.relationships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  encrypted_payload jsonb,
  encrypted_payload_version integer not null default 1,
  encryption_migration_state text not null default 'verified'
    check (encryption_migration_state in ('pending', 'migrating', 'verified', 'plaintext_cleared')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.relationship_import_runs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source text not null check (source in ('google_contacts', 'csv', 'manual')),
  status text not null default 'completed' check (status in ('started', 'completed', 'failed')),
  imported_count integer not null default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.relationship_import_inbox (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source text not null check (source in ('google_contacts', 'csv', 'manual')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'archived', 'merged')),
  source_fingerprint text,
  encrypted_payload jsonb,
  encrypted_payload_version integer not null default 1,
  encryption_migration_state text not null default 'verified'
    check (encryption_migration_state in ('pending', 'migrating', 'verified', 'plaintext_cleared')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.relationships enable row level security;
alter table public.relationship_import_runs enable row level security;
alter table public.relationship_import_inbox enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'relationships',
    'relationship_import_runs',
    'relationship_import_inbox'
  ]
  loop
    execute format('drop policy if exists "Users can view their own %1$s" on public.%1$I', table_name);
    execute format('create policy "Users can view their own %1$s" on public.%1$I for select using (auth.uid() = user_id)', table_name);
    execute format('drop policy if exists "Users can insert their own %1$s" on public.%1$I', table_name);
    execute format('create policy "Users can insert their own %1$s" on public.%1$I for insert with check (auth.uid() = user_id)', table_name);
    execute format('drop policy if exists "Users can update their own %1$s" on public.%1$I', table_name);
    execute format('create policy "Users can update their own %1$s" on public.%1$I for update using (auth.uid() = user_id)', table_name);
    execute format('drop policy if exists "Users can delete their own %1$s" on public.%1$I', table_name);
    execute format('create policy "Users can delete their own %1$s" on public.%1$I for delete using (auth.uid() = user_id)', table_name);
  end loop;
end $$;

create index if not exists relationships_user_updated_idx on public.relationships (user_id, updated_at desc);
create index if not exists relationship_import_inbox_user_status_idx on public.relationship_import_inbox (user_id, status, created_at desc);
create unique index if not exists relationship_import_inbox_source_fingerprint_uidx
  on public.relationship_import_inbox (user_id, source, source_fingerprint)
  where source_fingerprint is not null;

alter table public.relationships
  drop constraint if exists relationships_zero_knowledge_payload_required,
  add constraint relationships_zero_knowledge_payload_required
    check (public.zero_knowledge_is_forced() = false or encrypted_payload is not null) not valid;

alter table public.relationship_import_inbox
  drop constraint if exists relationship_import_inbox_zero_knowledge_payload_required,
  add constraint relationship_import_inbox_zero_knowledge_payload_required
    check (public.zero_knowledge_is_forced() = false or encrypted_payload is not null) not valid;

create or replace function public.delete_user_data()
returns void as $$
begin
  delete from public.relationship_import_inbox where user_id = auth.uid();
  delete from public.relationship_import_runs where user_id = auth.uid();
  delete from public.relationships where user_id = auth.uid();
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

comment on table public.relationships is 'RelationshipOS private memory. All relationship content lives in encrypted_payload.';
comment on table public.relationship_import_inbox is 'One-time imports awaiting user triage. Imported identity and merge suggestions are encrypted.';
comment on column public.relationship_import_inbox.source_fingerprint is 'SHA-256 dedupe key. Raw Google identifiers remain encrypted.';
comment on table public.relationship_import_runs is 'Metadata-only import audit trail. No imported contact content is stored here.';

commit;

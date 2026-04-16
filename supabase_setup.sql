create policy "Users can view own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);

create policy "Users can upload to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);

create policy "Users can update own files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);

create policy "Users can delete own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);

-- 1. Create Profiles table (for user metadata and plan tracking)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  plan text default 'free', -- 'free' or 'pro'
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create Notes table
create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default '',
  content text default '',
  mood text,
  thumbnail_url text,
  tags text[] default '{}',
  attachments jsonb default '[]',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table notes enable row level security;

-- 4. Profiles Policies
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- 5. Notes Policies (Strictly scoped to the authenticated user)
create policy "Users can view their own notes" on notes for select using (auth.uid() = user_id);
create policy "Users can insert their own notes" on notes for insert with check (auth.uid() = user_id);
create policy "Users can update their own notes" on notes for update using (auth.uid() = user_id);
create policy "Users can delete their own notes" on notes for delete using (auth.uid() = user_id);

-- 6. SaaS Limit Enforcement (Server-side Trigger)
-- This ensures free users cannot bypass the 30-note monthly limit via API calls
create or replace function enforce_note_limit()
returns trigger as $$
declare
  note_count int;
begin
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

-- Drop trigger if it exists before creating to prevent errors
drop trigger if exists tr_enforce_note_limit on notes;
create trigger tr_enforce_note_limit
before insert on notes
for each row execute function enforce_note_limit();

-- 7. Trigger for profile creation on signup
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

END $$;

-- 8. Function to delete all data for the current user
create or replace function delete_user_data()
returns void as $$
begin
  -- Delete all notes belonging to the user
  delete from public.notes where user_id = auth.uid();
  
  -- Delete the user's profile
  delete from public.profiles where id = auth.uid();
  
  -- Note: We can't easily delete from auth.users via RPC as a non-admin 
  -- without specialized setup. This wipes their data from the public schema.
end;
$$ language plpgsql security definer;

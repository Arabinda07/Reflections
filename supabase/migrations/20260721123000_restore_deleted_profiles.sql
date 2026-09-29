-- Restore profiles deleted accidentally without changing application data.
-- Legacy accounts were intentionally migrated to reflective mode. Accounts with
-- existing encryption material remain encrypted.

begin;

insert into public.profiles (
  id,
  full_name,
  avatar_url,
  newsletter_opt_in,
  user_mode,
  onboarding_completed_at,
  updated_at
)
select
  users.id,
  nullif(coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name'), ''),
  nullif(coalesce(users.raw_user_meta_data ->> 'avatar_url', users.raw_user_meta_data ->> 'picture'), ''),
  case lower(coalesce(users.raw_user_meta_data ->> 'newsletter_opt_in', 'false'))
    when 'true' then true
    else false
  end,
  case when
    exists (select 1 from public.user_encryption_keys keys where keys.user_id = users.id)
    or exists (select 1 from public.notes where user_id = users.id and encrypted_payload is not null)
    or exists (select 1 from public.mood_checkins where user_id = users.id and encrypted_payload is not null)
    or exists (select 1 from public.future_letters where user_id = users.id and encrypted_payload is not null)
    or exists (select 1 from public.life_themes where user_id = users.id and encrypted_payload is not null)
    or exists (select 1 from public.relationships where user_id = users.id and encrypted_payload is not null)
    or exists (select 1 from public.relationship_import_inbox where user_id = users.id and encrypted_payload is not null)
    then 'encrypted'
    else 'reflective'
  end,
  now(),
  now()
from auth.users as users
where users.deleted_at is null
on conflict (id) do nothing;

commit;

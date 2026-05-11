alter table public.profiles
add column if not exists newsletter_unsubscribed_at timestamptz;

grant select (newsletter_unsubscribed_at)
on table public.profiles
to authenticated;

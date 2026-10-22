alter table public.event_settings
  add column if not exists payment_review_note text,
  add column if not exists speakers_target_note text,
  add column if not exists sponsors_target_note text,
  add column if not exists venue_target_note text;

create table public.interest_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  topic text not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint interest_signups_topic_check check (topic in ('speakers', 'sponsors', 'venue')),
  constraint interest_signups_email_topic_unique unique (email, topic)
);

alter table public.interest_signups enable row level security;

create policy interest_signups_staff on public.interest_signups
  for select to authenticated
  using (
    private.has_any_role(array['super_admin', 'district_admin', 'content_editor']::public.app_role[])
  );

revoke all on table public.interest_signups from anon;
grant select on table public.interest_signups to authenticated;
grant select, insert, update, delete on table public.interest_signups to service_role;

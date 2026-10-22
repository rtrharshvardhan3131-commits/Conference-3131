-- The SOVEREIGN Summit conference platform.
-- Authorisation lives in public.user_roles. Do not trust user_metadata.

create schema if not exists private;

create type public.app_role as enum (
  'super_admin', 'district_admin', 'finance_admin', 'registration_admin', 'content_editor', 'delegate'
);
create type public.publication_status as enum ('draft', 'published', 'archived');
create type public.registration_status as enum (
  'draft', 'pending_payment', 'confirmed', 'payment_failed', 'cancelled', 'refund_pending', 'refunded'
);
create type public.payment_status as enum (
  'created', 'pending', 'authorized', 'captured', 'failed', 'cancelled', 'refund_pending', 'partially_refunded', 'refunded'
);
create type public.reconciliation_status as enum (
  'unreconciled', 'matched', 'exception', 'simulated', 'manually_verified'
);
create type public.venue_status as enum ('pending_approval', 'published');
create type public.enquiry_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type public.refund_status as enum ('requested', 'approved', 'processing', 'refunded', 'rejected', 'failed');
create type public.webhook_status as enum ('processing', 'processed', 'failed');

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  dietary_preference text,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.user_roles (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default pg_catalog.now(),
  unique (user_id, role)
);

create or replace function private.has_any_role(required public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role = any (required)
  );
$$;

revoke all on function private.has_any_role(public.app_role[]) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_any_role(public.app_role[]) to authenticated;

create table public.event_settings (
  id smallint primary key default 1 check (id = 1),
  event_name text not null,
  subtitle text not null,
  rotaract_year text not null,
  district_name text not null,
  host_club text not null,
  starts_on date not null,
  ends_on date not null,
  timezone text not null default 'Asia/Kolkata',
  duration_label text not null,
  tagline text not null,
  planning_attendance integer,
  registration_open boolean not null default false,
  public_email text,
  public_phone text,
  policy_version text not null,
  field_requirements jsonb not null,
  social_links jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.event_operations (
  id smallint primary key default 1 check (id = 1),
  registration_limit integer check (registration_limit is null or registration_limit >= 0),
  budget_ceiling_paise integer check (budget_ceiling_paise is null or budget_ceiling_paise >= 0),
  pending_hold_minutes integer not null default 30 check (pending_hold_minutes between 10 and 180),
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.venue_details (
  id smallint primary key default 1 check (id = 1),
  status public.venue_status not null default 'pending_approval',
  region text not null,
  name text,
  address text,
  map_url text,
  accommodation text,
  check_in_notes text,
  meal_notes text,
  transport_notes text,
  parking_notes text,
  accessibility_notes text,
  guidelines text,
  updated_at timestamptz not null default pg_catalog.now(),
  constraint venue_published_has_identity check (
    status <> 'published' or (name is not null and address is not null)
  )
);

create table public.site_pages (
  slug text primary key,
  title text not null,
  summary text not null default '',
  body text not null,
  status public.publication_status not null default 'published',
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.highlights (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  title text not null,
  detail text not null,
  sort_order integer not null default 0,
  status public.publication_status not null default 'published'
);

create table public.registration_slabs (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  name text not null,
  description text not null default '',
  benefits text[] not null default '{}',
  price_paise integer not null check (price_paise > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  quantity_limit integer check (quantity_limit is null or quantity_limit >= 0),
  status public.publication_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint slab_window check (ends_at > starts_at)
);

create sequence public.registration_reference_seq;

create table public.registrations (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  reference text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null,
  club text not null,
  designation text not null default '',
  district_zone text not null default '',
  emergency_contact_name text not null default '',
  emergency_contact_phone text not null default '',
  dietary_preference text not null default '',
  accommodation_preference text not null default '',
  slab_id uuid references public.registration_slabs (id),
  slab_name_snapshot text not null,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  status public.registration_status not null default 'pending_payment',
  policy_version text not null,
  policy_accepted_at timestamptz not null,
  checked_in_at timestamptz,
  checked_in_by uuid references auth.users (id),
  check_in_exception_reason text,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create unique index registrations_active_email_idx
  on public.registrations (lower(email))
  where status in ('pending_payment', 'confirmed', 'refund_pending');

create index registrations_status_created_idx on public.registrations (status, created_at desc);
create index registrations_club_idx on public.registrations (club);

create table public.payments (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  provider text not null,
  provider_order_id text,
  provider_payment_id text,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  status public.payment_status not null default 'created',
  method text,
  reconciliation_status public.reconciliation_status not null default 'unreconciled',
  verified_at timestamptz,
  manual_reference text,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create unique index payments_provider_order_idx
  on public.payments (provider, provider_order_id)
  where provider_order_id is not null;

create index payments_registration_idx on public.payments (registration_id, created_at desc);

create table public.webhook_events (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  processing_status public.webhook_status not null default 'processing',
  error text,
  received_at timestamptz not null default pg_catalog.now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create table public.refunds (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  payment_id uuid not null references public.payments (id),
  registration_id uuid not null references public.registrations (id),
  amount_paise integer not null check (amount_paise > 0),
  status public.refund_status not null default 'requested',
  reason text not null,
  provider_refund_id text,
  requested_by uuid references auth.users (id),
  decided_by uuid references auth.users (id),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.speakers (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  name text not null,
  designation text not null default '',
  organization text,
  biography text not null default '',
  photo_path text,
  links jsonb not null default '[]'::jsonb,
  status public.publication_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.agenda_sessions (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  title text not null,
  description text not null default '',
  session_date date not null,
  starts_at time not null,
  ends_at time not null,
  speaker_id uuid references public.speakers (id) on delete set null,
  location text,
  category text not null default 'Session',
  sort_order integer not null default 0,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint agenda_time_order check (ends_at > starts_at)
);

create index agenda_date_idx on public.agenda_sessions (session_date, sort_order);

create table public.sponsor_tiers (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0
);

create table public.sponsors (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  tier_id uuid not null references public.sponsor_tiers (id),
  name text not null,
  description text,
  website text,
  logo_path text,
  sort_order integer not null default 0,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.faqs (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  category text not null,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  status public.publication_status not null default 'published'
);

create table public.announcements (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'public' check (audience in ('public', 'delegates', 'staff')),
  publish_at timestamptz,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.support_enquiries (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  kind text not null check (kind in ('contact', 'sponsorship', 'delegate_support')),
  name text not null,
  email text not null,
  phone text,
  organisation text,
  subject text not null,
  message text not null,
  status public.enquiry_status not null default 'open',
  registration_id uuid references public.registrations (id),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.notification_logs (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  template text not null,
  recipient text not null,
  registration_id uuid references public.registrations (id),
  campaign_id uuid,
  status text not null,
  error text,
  created_at timestamptz not null default pg_catalog.now()
);

create unique index notification_registration_template_idx
  on public.notification_logs (registration_id, template)
  where registration_id is not null and status = 'sent';

create table public.notification_campaigns (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null,
  recipient_count integer not null,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default pg_catalog.now()
);

alter table public.notification_logs
  add constraint notification_logs_campaign_fk
  foreign key (campaign_id) references public.notification_campaigns (id);

create table public.audit_logs (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  actor_id uuid references auth.users (id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now()
);

create index audit_logs_created_idx on public.audit_logs (created_at desc);

create table public.rate_limits (
  id bigint generated always as identity primary key,
  action text not null,
  subject text not null,
  created_at timestamptz not null default pg_catalog.now()
);

create index rate_limits_lookup_idx on public.rate_limits (action, subject, created_at desc);

create or replace function public.consume_rate_limit(
  p_action text,
  p_subject text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;
  select count(*) into current_count
  from public.rate_limits
  where action = p_action
    and subject = p_subject
    and created_at > pg_catalog.now() - make_interval(secs => p_window_seconds);
  if current_count >= p_limit then
    return false;
  end if;
  insert into public.rate_limits (action, subject) values (p_action, p_subject);
  return true;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;

create or replace function public.create_pending_registration(
  p_user_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_club text,
  p_designation text,
  p_district_zone text,
  p_emergency_name text,
  p_emergency_phone text,
  p_dietary text,
  p_accommodation text,
  p_slab_id uuid,
  p_policy_version text,
  p_provider text,
  p_manual_reference text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  settings public.event_settings%rowtype;
  operations public.event_operations%rowtype;
  slab public.registration_slabs%rowtype;
  used_seats integer;
  slab_used integer;
  new_id uuid;
  new_reference text;
  payment_id uuid;
begin
  if p_policy_version is null or length(trim(p_policy_version)) = 0 then
    raise exception 'APP:consent_required';
  end if;

  select * into settings from public.event_settings where id = 1 for update;
  if not found then
    raise exception 'APP:registration_closed';
  end if;
  select * into operations from public.event_operations where id = 1 for update;
  if not found then
    raise exception 'APP:registration_closed';
  end if;
  if settings.registration_open is not true then
    raise exception 'APP:registration_closed';
  end if;

  update public.registrations
  set status = 'cancelled', updated_at = pg_catalog.now()
  where status = 'pending_payment'
    and created_at < pg_catalog.now() - make_interval(mins => operations.pending_hold_minutes)
    and not exists (
      select 1 from public.payments payment
      where payment.registration_id = registrations.id
        and payment.provider = 'manual'
        and payment.status in ('pending', 'created')
    )
    and not exists (
      select 1 from public.payments payment
      where payment.registration_id = registrations.id
        and payment.status in ('captured', 'authorized')
    );

  if exists (
    select 1 from public.registrations
    where lower(email) = lower(p_email)
      and status in ('pending_payment', 'confirmed', 'refund_pending')
  ) then
    raise exception 'APP:duplicate_registration';
  end if;

  select count(*) into used_seats
  from public.registrations
  where status in ('pending_payment', 'confirmed', 'refund_pending');

  if operations.registration_limit is not null and used_seats >= operations.registration_limit then
    raise exception 'APP:capacity_reached';
  end if;

  select * into slab from public.registration_slabs where id = p_slab_id for update;
  if not found then
    raise exception 'APP:slab_unavailable';
  end if;
  if slab.status <> 'published'
    or pg_catalog.now() < slab.starts_at
    or pg_catalog.now() > slab.ends_at then
    raise exception 'APP:slab_unavailable';
  end if;

  select count(*) into slab_used
  from public.registrations
  where slab_id = slab.id
    and status in ('pending_payment', 'confirmed', 'refund_pending');

  if slab.quantity_limit is not null and slab_used >= slab.quantity_limit then
    raise exception 'APP:slab_unavailable';
  end if;

  new_reference := 'SS27-' || lpad(nextval('public.registration_reference_seq')::text, 5, '0');
  insert into public.registrations (
    reference, user_id, full_name, email, phone, club, designation, district_zone,
    emergency_contact_name, emergency_contact_phone, dietary_preference, accommodation_preference,
    slab_id, slab_name_snapshot, amount_paise, status, policy_version, policy_accepted_at
  ) values (
    new_reference, p_user_id, trim(p_full_name), lower(trim(p_email)), trim(p_phone), trim(p_club),
    coalesce(p_designation, ''), coalesce(p_district_zone, ''), coalesce(p_emergency_name, ''),
    coalesce(p_emergency_phone, ''), coalesce(p_dietary, ''), coalesce(p_accommodation, ''),
    slab.id, slab.name, slab.price_paise, 'pending_payment', p_policy_version, pg_catalog.now()
  ) returning id into new_id;

  insert into public.payments (
    registration_id, provider, amount_paise, status, reconciliation_status, manual_reference
  ) values (
    new_id,
    p_provider,
    slab.price_paise,
    case when p_provider = 'manual' then 'pending'::public.payment_status else 'created'::public.payment_status end,
    'unreconciled',
    nullif(trim(coalesce(p_manual_reference, '')), '')
  ) returning id into payment_id;

  return jsonb_build_object(
    'registration_id', new_id,
    'reference', new_reference,
    'amount_paise', slab.price_paise,
    'currency', 'INR',
    'slab_name', slab.name,
    'payment_id', payment_id
  );
end;
$$;

revoke all on function public.create_pending_registration(
  uuid, text, text, text, text, text, text, text, text, text, text, uuid, text, text, text
) from public, anon, authenticated;
grant execute on function public.create_pending_registration(
  uuid, text, text, text, text, text, text, text, text, text, text, uuid, text, text, text
) to service_role;

create or replace function public.apply_verified_payment(
  p_payment_id uuid,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_amount_paise integer,
  p_method text,
  p_reconciliation public.reconciliation_status
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  payment public.payments%rowtype;
  registration public.registrations%rowtype;
begin
  select * into payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'APP:not_found';
  end if;
  select * into registration from public.registrations where id = payment.registration_id for update;

  if payment.amount_paise <> p_amount_paise then
    update public.payments
    set reconciliation_status = 'exception', updated_at = pg_catalog.now()
    where id = payment.id;
    raise exception 'APP:amount_mismatch';
  end if;

  if payment.status = 'captured' and registration.status = 'confirmed' then
    return jsonb_build_object('idempotent', true, 'reference', registration.reference, 'registration_id', registration.id);
  end if;

  if registration.status not in ('pending_payment', 'payment_failed') then
    raise exception 'APP:registration_not_payable';
  end if;

  update public.payments
  set status = 'captured',
      provider_order_id = coalesce(p_provider_order_id, provider_order_id),
      provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      method = coalesce(p_method, method),
      reconciliation_status = p_reconciliation,
      verified_at = pg_catalog.now(),
      updated_at = pg_catalog.now()
  where id = payment.id;

  update public.registrations
  set status = 'confirmed', updated_at = pg_catalog.now()
  where id = registration.id;

  return jsonb_build_object('idempotent', false, 'reference', registration.reference, 'registration_id', registration.id);
end;
$$;

revoke all on function public.apply_verified_payment(uuid, text, text, integer, text, public.reconciliation_status)
  from public, anon, authenticated;
grant execute on function public.apply_verified_payment(uuid, text, text, integer, text, public.reconciliation_status)
  to service_role;

create or replace function public.mark_payment_failed(p_payment_id uuid) returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  payment public.payments%rowtype;
begin
  select * into payment from public.payments where id = p_payment_id for update;
  if not found or payment.status = 'captured' then
    return;
  end if;
  update public.payments set status = 'failed', updated_at = pg_catalog.now() where id = payment.id;
  update public.registrations
  set status = 'payment_failed', updated_at = pg_catalog.now()
  where id = payment.registration_id and status = 'pending_payment';
end;
$$;

revoke all on function public.mark_payment_failed(uuid) from public, anon, authenticated;
grant execute on function public.mark_payment_failed(uuid) to service_role;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'delegate');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Row level security. Writes to operational tables go through the service role.
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.event_settings enable row level security;
alter table public.event_operations enable row level security;
alter table public.venue_details enable row level security;
alter table public.site_pages enable row level security;
alter table public.highlights enable row level security;
alter table public.registration_slabs enable row level security;
alter table public.registrations enable row level security;
alter table public.payments enable row level security;
alter table public.webhook_events enable row level security;
alter table public.refunds enable row level security;
alter table public.speakers enable row level security;
alter table public.agenda_sessions enable row level security;
alter table public.sponsor_tiers enable row level security;
alter table public.sponsors enable row level security;
alter table public.faqs enable row level security;
alter table public.announcements enable row level security;
alter table public.support_enquiries enable row level security;
alter table public.notification_logs enable row level security;
alter table public.notification_campaigns enable row level security;
alter table public.audit_logs enable row level security;
alter table public.rate_limits enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.event_settings, public.site_pages, public.highlights,
  public.registration_slabs, public.speakers, public.agenda_sessions, public.sponsor_tiers,
  public.sponsors, public.faqs, public.announcements to anon, authenticated;
grant select on public.profiles, public.user_roles, public.registrations, public.payments, public.refunds
  to authenticated;
grant select, update (full_name, phone, emergency_contact_name, emergency_contact_phone, dietary_preference)
  on public.profiles to authenticated;
grant select on public.event_operations, public.support_enquiries, public.audit_logs,
  public.notification_campaigns to authenticated;

create policy event_settings_read on public.event_settings for select to anon, authenticated using (true);
create policy venue_staff_read on public.venue_details for select to authenticated using (
  private.has_any_role(array['super_admin', 'district_admin', 'content_editor']::public.app_role[])
);

-- security_invoker cannot hide columns until publication, so this view is definer-owned
-- and selects only the fields that are allowed on the public site.
create view public.venue_public with (security_invoker = false) as
select
  status,
  region,
  case when status = 'published' then name else null end as name,
  case when status = 'published' then address else null end as address,
  case when status = 'published' then map_url else null end as map_url,
  case when status = 'published' then accommodation else null end as accommodation,
  case when status = 'published' then check_in_notes else null end as check_in_notes,
  case when status = 'published' then meal_notes else null end as meal_notes,
  case when status = 'published' then transport_notes else null end as transport_notes,
  case when status = 'published' then parking_notes else null end as parking_notes,
  case when status = 'published' then accessibility_notes else null end as accessibility_notes,
  case when status = 'published' then guidelines else null end as guidelines
from public.venue_details
where id = 1;

grant select on public.venue_public to anon, authenticated;
grant select on public.venue_details to authenticated;
create policy pages_public on public.site_pages for select to anon using (status = 'published');
create policy pages_staff on public.site_pages for select to authenticated using (
  status = 'published' or private.has_any_role(array['super_admin', 'district_admin', 'content_editor']::public.app_role[])
);
create policy highlights_public on public.highlights for select to anon using (status = 'published');
create policy highlights_staff on public.highlights for select to authenticated using (
  status = 'published' or private.has_any_role(array['super_admin', 'district_admin', 'content_editor']::public.app_role[])
);
create policy slabs_public on public.registration_slabs for select to anon using (status = 'published');
create policy slabs_staff on public.registration_slabs for select to authenticated using (
  status = 'published' or private.has_any_role(array['super_admin', 'district_admin', 'finance_admin']::public.app_role[])
);
create policy speakers_public on public.speakers for select to anon using (
  status = 'published' and photo_path is not null and designation <> '' and biography <> ''
);
create policy speakers_staff on public.speakers for select to authenticated using (
  (status = 'published' and photo_path is not null and designation <> '' and biography <> '')
  or private.has_any_role(array['super_admin', 'district_admin', 'content_editor']::public.app_role[])
);
create policy agenda_public on public.agenda_sessions for select to anon using (status = 'published');
create policy agenda_staff on public.agenda_sessions for select to authenticated using (
  status = 'published' or private.has_any_role(array['super_admin', 'district_admin', 'content_editor']::public.app_role[])
);
create policy tiers_read on public.sponsor_tiers for select to anon, authenticated using (true);
create policy sponsors_public on public.sponsors for select to anon using (status = 'published' and logo_path is not null);
create policy sponsors_staff on public.sponsors for select to authenticated using (
  (status = 'published' and logo_path is not null)
  or private.has_any_role(array['super_admin', 'district_admin', 'content_editor']::public.app_role[])
);
create policy faqs_public on public.faqs for select to anon using (status = 'published');
create policy faqs_staff on public.faqs for select to authenticated using (
  status = 'published' or private.has_any_role(array['super_admin', 'district_admin', 'content_editor']::public.app_role[])
);
create policy announcements_public on public.announcements for select to anon using (
  status = 'published' and audience = 'public' and (publish_at is null or publish_at <= pg_catalog.now())
);
create policy announcements_auth on public.announcements for select to authenticated using (
  (status = 'published' and audience in ('public', 'delegates') and (publish_at is null or publish_at <= pg_catalog.now()))
  or private.has_any_role(array['super_admin', 'district_admin', 'content_editor']::public.app_role[])
);

create policy profiles_select on public.profiles for select to authenticated using (
  id = (select auth.uid())
  or private.has_any_role(array['super_admin', 'district_admin', 'finance_admin', 'registration_admin']::public.app_role[])
);
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
create policy roles_select on public.user_roles for select to authenticated using (
  user_id = (select auth.uid())
  or private.has_any_role(array['super_admin']::public.app_role[])
);
create policy operations_select on public.event_operations for select to authenticated using (
  private.has_any_role(array['super_admin', 'district_admin', 'finance_admin', 'registration_admin']::public.app_role[])
);
create policy registrations_select on public.registrations for select to authenticated using (
  user_id = (select auth.uid())
  or private.has_any_role(array['super_admin', 'district_admin', 'finance_admin', 'registration_admin']::public.app_role[])
);
create policy payments_select on public.payments for select to authenticated using (
  exists (
    select 1 from public.registrations registration
    where registration.id = payments.registration_id
      and registration.user_id = (select auth.uid())
  )
  or private.has_any_role(array['super_admin', 'district_admin', 'finance_admin', 'registration_admin']::public.app_role[])
);
create policy refunds_select on public.refunds for select to authenticated using (
  exists (
    select 1 from public.registrations registration
    where registration.id = refunds.registration_id
      and registration.user_id = (select auth.uid())
  )
  or private.has_any_role(array['super_admin', 'finance_admin', 'district_admin']::public.app_role[])
);
create policy enquiries_select on public.support_enquiries for select to authenticated using (
  private.has_any_role(array['super_admin', 'district_admin', 'registration_admin']::public.app_role[])
);
create policy audit_select on public.audit_logs for select to authenticated using (
  private.has_any_role(array['super_admin', 'district_admin']::public.app_role[])
);
create policy campaigns_select on public.notification_campaigns for select to authenticated using (
  private.has_any_role(array['super_admin', 'district_admin']::public.app_role[])
);

-- Delegates may read published announcements and their own records. No client write grants on money tables.

insert into public.event_settings (
  event_name, subtitle, rotaract_year, district_name, host_club, starts_on, ends_on, timezone,
  duration_label, tagline, planning_attendance, registration_open, policy_version, field_requirements
) values (
  'The SOVEREIGN Summit',
  'District Conference | Rotaract District 3131',
  'RIY 2026–27',
  'Rotaract District 3131',
  'Rotaract Club of Bavdhan Pioneers',
  '2027-02-13',
  '2027-02-14',
  'Asia/Kolkata',
  '2 days and 1 night',
  'Two Days. One Summit. A District United.',
  400,
  true,
  '2026-10-14',
  '{"designation":false,"districtZone":false,"emergencyContact":true,"dietary":true,"accommodation":true}'::jsonb
);

insert into public.event_operations (registration_limit, budget_ceiling_paise)
values (null, 150000000);

insert into public.venue_details (status, region)
values (
  'pending_approval',
  'Lonavala, Mahabaleshwar, Mulshi, or another suitable resort outside Pune city limits'
);

insert into public.registration_slabs (id, name, description, benefits, price_paise, starts_at, ends_at, status, sort_order)
values
  ('10000000-0000-4000-8000-000000000001', 'Early Bird', 'Provisional early registration. An administrator can revise future slabs without changing completed payments.', array['Conference registration', 'Residential delegate package as finally published'], 180000, '2026-10-01T00:00:00+05:30', '2026-11-30T23:59:59+05:30', 'published', 1),
  ('10000000-0000-4000-8000-000000000002', 'Slab 1', 'Provisional registration slab.', array['Conference registration', 'Residential delegate package as finally published'], 229900, '2026-12-01T00:00:00+05:30', '2026-12-31T23:59:59+05:30', 'published', 2),
  ('10000000-0000-4000-8000-000000000003', 'Slab 2', 'Provisional registration slab.', array['Conference registration', 'Residential delegate package as finally published'], 259900, '2027-01-01T00:00:00+05:30', '2027-01-31T23:59:59+05:30', 'published', 3),
  ('10000000-0000-4000-8000-000000000004', 'Final', 'Provisional final registration slab.', array['Conference registration', 'Residential delegate package as finally published'], 299900, '2027-02-01T00:00:00+05:30', '2027-02-10T23:59:59+05:30', 'published', 4);

insert into public.sponsor_tiers (name, sort_order) values
  ('Title Sponsor', 1),
  ('Gold Sponsor', 2),
  ('Silver Sponsor', 3),
  ('Associate Sponsor', 4),
  ('Partner', 5);

insert into public.highlights (title, detail, sort_order) values
  ('Two-day residential format', 'A district conference held across 13 and 14 February 2027.', 1),
  ('One night’s stay', 'Accommodation is part of the residential format once the venue is approved.', 2),
  ('Leadership sessions', 'Programme sessions will be published after they are confirmed.', 3),
  ('Guest speakers', 'Speaker profiles appear only when the person and biography are approved.', 4),
  ('Networking', 'Time for clubs across the district to meet and work together.', 5),
  ('Fellowship and entertainment', 'An approved social programme will be announced with the agenda.', 6),
  ('Delegate souvenir', 'A conference souvenir is planned for registered delegates.', 7);

grant usage, select on sequence public.registration_reference_seq to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-assets',
  'public-assets',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy public_assets_read
on storage.objects for select
to anon, authenticated
using (bucket_id = 'public-assets');

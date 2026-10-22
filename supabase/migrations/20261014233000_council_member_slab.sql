alter table public.registrations
  add column if not exists council_member boolean not null default false,
  add column if not exists council_position text not null default '';

drop function if exists public.create_pending_registration(
  uuid, text, text, text, text, text, text, text, text, text, text, uuid, text, text, text
);

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
  p_manual_reference text,
  p_council_member boolean,
  p_council_position text
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
  council_position text;
begin
  if p_policy_version is null or length(trim(p_policy_version)) = 0 then
    raise exception 'APP:consent_required';
  end if;
  council_position := trim(coalesce(p_council_position, ''));
  if p_council_member is true and length(council_position) = 0 then
    raise exception 'APP:council_position_required';
  end if;
  if p_council_member is not true then
    council_position := '';
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

  if not exists (
    select 1 from public.registration_slabs
    where status = 'published'
      and pg_catalog.now() >= starts_at
      and pg_catalog.now() <= ends_at
  ) then
    raise exception 'APP:slab_unavailable';
  end if;

  if p_council_member is true then
    select * into slab
    from public.registration_slabs
    where status = 'published'
    order by sort_order asc, price_paise asc
    limit 1
    for update;
  else
    select * into slab from public.registration_slabs where id = p_slab_id for update;
    if not found
      or slab.status <> 'published'
      or pg_catalog.now() < slab.starts_at
      or pg_catalog.now() > slab.ends_at then
      raise exception 'APP:slab_unavailable';
    end if;
  end if;

  if not found then
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
    slab_id, slab_name_snapshot, amount_paise, status, policy_version, policy_accepted_at,
    council_member, council_position
  ) values (
    new_reference, p_user_id, trim(p_full_name), lower(trim(p_email)), trim(p_phone), trim(p_club),
    coalesce(p_designation, ''), coalesce(p_district_zone, ''), coalesce(p_emergency_name, ''),
    coalesce(p_emergency_phone, ''), coalesce(p_dietary, ''), coalesce(p_accommodation, ''),
    slab.id, slab.name, slab.price_paise, 'pending_payment', p_policy_version, pg_catalog.now(),
    p_council_member is true, council_position
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
  uuid, text, text, text, text, text, text, text, text, text, text, uuid, text, text, text, boolean, text
) from public, anon, authenticated;
grant execute on function public.create_pending_registration(
  uuid, text, text, text, text, text, text, text, text, text, text, uuid, text, text, text, boolean, text
) to service_role;

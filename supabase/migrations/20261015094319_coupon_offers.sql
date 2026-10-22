alter table public.registrations
  add column if not exists coupon_code text not null default '',
  add column if not exists discount_paise integer not null default 0;

alter table public.registrations
  drop constraint if exists registrations_discount_paise_check;

alter table public.registrations
  add constraint registrations_discount_paise_check check (discount_paise >= 0);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  kind text not null,
  percent integer,
  value_paise integer,
  starts_at timestamptz,
  ends_at timestamptz,
  quantity_limit integer,
  quantity_used integer not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default pg_catalog.now(),
  constraint coupons_code_format check (code ~ '^[A-Z0-9-]{3,32}$'),
  constraint coupons_code_unique unique (code),
  constraint coupons_kind_check check (kind in ('percent', 'amount')),
  constraint coupons_status_check check (status in ('draft', 'published', 'archived')),
  constraint coupons_shape_check check (
    (kind = 'percent' and percent between 1 and 100 and value_paise is null)
    or (kind = 'amount' and value_paise > 0 and percent is null)
  ),
  constraint coupons_window_check check (starts_at is null or ends_at is null or ends_at >= starts_at),
  constraint coupons_quantity_check check (
    (quantity_limit is null or quantity_limit >= 0)
    and quantity_used >= 0
  )
);

alter table public.coupons enable row level security;

create policy coupons_staff on public.coupons
  for select to authenticated
  using (
    private.has_any_role(array['super_admin', 'district_admin', 'finance_admin']::public.app_role[])
  );

create or replace function public.release_coupon_redemption()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.coupon_code <> '' and old.status = 'pending_payment' then
      update public.coupons
      set quantity_used = greatest(quantity_used - 1, 0)
      where code = old.coupon_code;
    end if;
    return old;
  end if;

  if old.coupon_code <> '' and old.status = 'pending_payment' and new.status = 'cancelled' then
    update public.coupons
    set quantity_used = greatest(quantity_used - 1, 0)
    where code = old.coupon_code;
  end if;
  return new;
end;
$$;

drop trigger if exists registrations_release_coupon on public.registrations;
create trigger registrations_release_coupon
  after update of status or delete on public.registrations
  for each row execute function public.release_coupon_redemption();

revoke all on function public.release_coupon_redemption() from public, anon, authenticated;
grant execute on function public.release_coupon_redemption() to service_role;

drop function if exists public.create_pending_registration(
  uuid, text, text, text, text, text, text, text, text, text, text, uuid, text, text, text, boolean, text
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
  p_council_position text,
  p_coupon_code text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  settings public.event_settings%rowtype;
  operations public.event_operations%rowtype;
  slab public.registration_slabs%rowtype;
  coupon public.coupons%rowtype;
  used_seats integer;
  slab_used integer;
  new_id uuid;
  new_reference text;
  payment_id uuid;
  council_position text;
  normalized_code text;
  discount integer := 0;
  payable integer;
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
  normalized_code := upper(trim(coalesce(p_coupon_code, '')));

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

  payable := slab.price_paise;
  if length(normalized_code) > 0 then
    if normalized_code !~ '^[A-Z0-9-]{3,32}$' then
      raise exception 'APP:coupon_invalid';
    end if;
    select * into coupon from public.coupons where code = normalized_code for update;
    if not found
      or coupon.status <> 'published'
      or (coupon.starts_at is not null and pg_catalog.now() < coupon.starts_at)
      or (coupon.ends_at is not null and pg_catalog.now() > coupon.ends_at)
      or (coupon.quantity_limit is not null and coupon.quantity_used >= coupon.quantity_limit) then
      raise exception 'APP:coupon_invalid';
    end if;
    if coupon.kind = 'percent' then
      discount := ((slab.price_paise::bigint * coupon.percent) / 100)::integer;
    elsif coupon.kind = 'amount' then
      discount := coupon.value_paise;
    else
      raise exception 'APP:coupon_invalid';
    end if;
    if discount <= 0 or discount >= slab.price_paise then
      raise exception 'APP:coupon_invalid';
    end if;
    payable := slab.price_paise - discount;
    update public.coupons set quantity_used = quantity_used + 1 where id = coupon.id;
  end if;

  new_reference := 'SS27-' || lpad(nextval('public.registration_reference_seq')::text, 5, '0');
  insert into public.registrations (
    reference, user_id, full_name, email, phone, club, designation, district_zone,
    emergency_contact_name, emergency_contact_phone, dietary_preference, accommodation_preference,
    slab_id, slab_name_snapshot, amount_paise, status, policy_version, policy_accepted_at,
    council_member, council_position, coupon_code, discount_paise
  ) values (
    new_reference, p_user_id, trim(p_full_name), lower(trim(p_email)), trim(p_phone), trim(p_club),
    coalesce(p_designation, ''), coalesce(p_district_zone, ''), coalesce(p_emergency_name, ''),
    coalesce(p_emergency_phone, ''), coalesce(p_dietary, ''), coalesce(p_accommodation, ''),
    slab.id, slab.name, payable, 'pending_payment', p_policy_version, pg_catalog.now(),
    p_council_member is true, council_position, case when discount > 0 then normalized_code else '' end, discount
  ) returning id into new_id;

  insert into public.payments (
    registration_id, provider, amount_paise, status, reconciliation_status, manual_reference
  ) values (
    new_id,
    p_provider,
    payable,
    case when p_provider = 'manual' then 'pending'::public.payment_status else 'created'::public.payment_status end,
    'unreconciled',
    nullif(trim(coalesce(p_manual_reference, '')), '')
  ) returning id into payment_id;

  return jsonb_build_object(
    'registration_id', new_id,
    'reference', new_reference,
    'amount_paise', payable,
    'currency', 'INR',
    'slab_name', slab.name,
    'payment_id', payment_id
  );
end;
$$;

revoke all on function public.create_pending_registration(
  uuid, text, text, text, text, text, text, text, text, text, text, uuid, text, text, text, boolean, text, text
) from public, anon, authenticated;
grant execute on function public.create_pending_registration(
  uuid, text, text, text, text, text, text, text, text, text, text, uuid, text, text, text, boolean, text, text
) to service_role;

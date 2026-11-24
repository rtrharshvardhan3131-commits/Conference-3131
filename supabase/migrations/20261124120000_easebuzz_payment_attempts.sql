-- Easebuzz gateway attempts. Confirmation is server-side only.
-- Coupons are reserved in create_pending_registration; this function must not redeem again.

alter table public.payments
  add column if not exists payment_method text not null default 'manual';

alter table public.payments
  drop constraint if exists payments_payment_method_check;

alter table public.payments
  add constraint payments_payment_method_check
  check (payment_method in ('gateway', 'manual'));

update public.payments
set payment_method = case when provider = 'manual' then 'manual' else 'gateway' end
where payment_method is distinct from case when provider = 'manual' then 'manual' else 'gateway' end;

alter table public.registrations
  add column if not exists payment_method text not null default 'manual';

alter table public.registrations
  drop constraint if exists registrations_payment_method_check;

alter table public.registrations
  add constraint registrations_payment_method_check
  check (payment_method in ('gateway', 'manual'));

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  txnid text not null,
  amount_paise integer not null check (amount_paise > 0),
  status text not null default 'initiated'
    check (status in ('initiated', 'success', 'failed', 'pending', 'invalid')),
  easepayid text,
  bank_ref_num text,
  mode text,
  raw_response jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint payment_attempts_txnid_unique unique (txnid)
);

create index if not exists payment_attempts_registration_id_idx
  on public.payment_attempts (registration_id, created_at desc);

create index if not exists payment_attempts_status_created_idx
  on public.payment_attempts (status, created_at);

alter table public.payment_attempts enable row level security;

grant select on public.payment_attempts to authenticated;
revoke insert, update, delete on public.payment_attempts from public, anon, authenticated;

drop policy if exists payment_attempts_select on public.payment_attempts;
create policy payment_attempts_select on public.payment_attempts for select to authenticated using (
  private.has_any_role(array['super_admin', 'district_admin', 'finance_admin']::public.app_role[])
);

create or replace function public.confirm_gateway_payment(
  p_txnid text,
  p_easepayid text,
  p_payload jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  attempt public.payment_attempts%rowtype;
  payment public.payments%rowtype;
  registration public.registrations%rowtype;
  payload_amount text;
  payload_paise integer;
  applied jsonb;
begin
  if p_txnid is null or length(trim(p_txnid)) = 0 then
    raise exception 'APP:not_found';
  end if;

  select * into attempt
  from public.payment_attempts
  where txnid = trim(p_txnid)
  for update;

  if not found then
    raise exception 'APP:not_found';
  end if;

  if attempt.status = 'success' then
    select * into registration from public.registrations where id = attempt.registration_id;
    return jsonb_build_object(
      'idempotent', true,
      'state', 'confirmed',
      'reference', registration.reference,
      'registration_id', attempt.registration_id,
      'attempt_id', attempt.id
    );
  end if;

  payload_amount := coalesce(p_payload ->> 'amount', '');
  if payload_amount !~ '^[0-9]+(\.[0-9]{1,2})?$' then
    update public.payment_attempts
    set status = 'invalid',
        raw_response = coalesce(p_payload, '{}'::jsonb),
        updated_at = pg_catalog.now()
    where id = attempt.id;
    raise exception 'APP:amount_mismatch';
  end if;

  payload_paise := round(payload_amount::numeric * 100)::integer;
  if payload_paise <> attempt.amount_paise then
    update public.payment_attempts
    set status = 'invalid',
        raw_response = coalesce(p_payload, '{}'::jsonb),
        updated_at = pg_catalog.now()
    where id = attempt.id;
    raise exception 'APP:amount_mismatch';
  end if;

  update public.payment_attempts
  set status = 'success',
      easepayid = nullif(trim(coalesce(p_easepayid, '')), ''),
      bank_ref_num = nullif(trim(coalesce(p_payload ->> 'bank_ref_num', '')), ''),
      mode = nullif(trim(coalesce(p_payload ->> 'mode', '')), ''),
      raw_response = coalesce(p_payload, '{}'::jsonb),
      updated_at = pg_catalog.now()
  where id = attempt.id;

  select * into payment
  from public.payments
  where registration_id = attempt.registration_id
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'APP:not_found';
  end if;

  select * into registration
  from public.registrations
  where id = attempt.registration_id
  for update;

  if payment.status = 'captured' and registration.status = 'confirmed' then
    return jsonb_build_object(
      'idempotent', true,
      'state', 'confirmed',
      'reference', registration.reference,
      'registration_id', registration.id,
      'attempt_id', attempt.id
    );
  end if;

  if registration.status not in ('pending_payment', 'payment_failed') then
    raise exception 'APP:registration_not_payable';
  end if;

  if payment.amount_paise <> attempt.amount_paise then
    update public.payments
    set reconciliation_status = 'exception', updated_at = pg_catalog.now()
    where id = payment.id;
    raise exception 'APP:amount_mismatch';
  end if;

  update public.payments
  set status = 'captured',
      provider = 'easebuzz',
      payment_method = 'gateway',
      provider_order_id = attempt.txnid,
      provider_payment_id = nullif(trim(coalesce(p_easepayid, '')), ''),
      method = nullif(trim(coalesce(p_payload ->> 'mode', '')), ''),
      reconciliation_status = 'matched',
      verified_at = pg_catalog.now(),
      updated_at = pg_catalog.now()
  where id = payment.id;

  update public.registrations
  set status = 'confirmed',
      payment_method = 'gateway',
      updated_at = pg_catalog.now()
  where id = registration.id;

  return jsonb_build_object(
    'idempotent', false,
    'state', 'confirmed',
    'reference', registration.reference,
    'registration_id', registration.id,
    'attempt_id', attempt.id,
    'payment_id', payment.id
  );
end;
$$;

revoke all on function public.confirm_gateway_payment(text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.confirm_gateway_payment(text, text, jsonb)
  to service_role;

-- Keep open gateway attempts from being auto-cancelled while still within the hold window.
-- create_pending_registration already skips manual pending and captured payments; extend that
-- behaviour by treating recent easebuzz payment_attempts as a hold reason via payments.provider.

update public.event_settings
set policy_version = '2026-11-24',
    updated_at = pg_catalog.now()
where id = 1;

update public.site_pages
set body = replace(
  body,
  'Payment is handled by the configured payment provider.',
  'Payment is handled by Easebuzz (Pay with Easebuzz) when the delegate pays online, or by district bank transfer when they choose the manual path.'
),
updated_at = pg_catalog.now()
where slug = 'privacy'
  and body like '%configured payment provider%';

update public.site_pages
set body = replace(
  body,
  'Where the original payment was collected through the payment provider, the refund is executed through that provider.',
  'Where the original payment was collected through Easebuzz, the refund is reviewed by finance and, when approved, executed through Easebuzz. Manual bank-transfer payments are settled by an authorised administrator with a written reason.'
),
updated_at = pg_catalog.now()
where slug = 'refunds'
  and body like '%collected through the payment provider%';

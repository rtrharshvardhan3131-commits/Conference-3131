alter table public.registrations
  add column if not exists rotary_id text not null default '',
  add column if not exists tshirt_size text not null default '',
  add column if not exists photograph_path text,
  add column if not exists photograph_filename text;

alter table public.registrations
  drop constraint if exists registrations_tshirt_size_check;

alter table public.registrations
  add constraint registrations_tshirt_size_check
  check (tshirt_size in ('', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'));

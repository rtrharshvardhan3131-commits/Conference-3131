alter table public.registrations
  add column if not exists government_id_path text,
  add column if not exists government_id_filename text;

alter table public.payments
  add column if not exists proof_path text,
  add column if not exists proof_filename text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'registration-documents',
  'registration-documents',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

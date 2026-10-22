alter table public.registrations
  add column if not exists room_number text,
  add column if not exists roommate_name text,
  add column if not exists room_note text;

comment on column public.registrations.room_number is 'Assigned by the committee. Blank until a room is allocated.';
comment on column public.registrations.roommate_name is 'Name typed by the committee for this delegate. Not a public directory.';
comment on column public.registrations.room_note is 'Check-in note for this delegate, such as a key instruction.';
